// src/modules/match/socket.ts
import { Server, Socket } from 'socket.io';
import { CustomHono } from '@/types/app.js';
import { addToMatchingQueue, removeFromQueue, findMatch, startMatch } from './match.service.js';
import { decodeSocketAuthToken } from './socketAuth.service.js';

interface MatchFilters {
  call_type: 'video' | 'audio';
  gender?: string;
  preferred_language?: string;
  country?: string;
  age_min?: number;
  age_max?: number;
  interests?: string[];
}

interface SocketUser {
  id: number;
  email: string;
}

type MatchingState = 'idle' | 'finding' | 'in_call';

interface AuthenticatedSocket extends Socket {
  data: {
    user: SocketUser;
    matchTimeout?: NodeJS.Timeout;
    matchingState: MatchingState;
    currentFilters?: MatchFilters;
  };
}

// Store connected users and their socket IDs
const connectedUsers = new Map<number, string>();

const MATCH_TIMEOUT = 30000; // 30 seconds to find match

export const setupMatchSocket = (app: CustomHono) => {
  const io = new Server({
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/match"
  });

  // JWT Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Token required'));

      const decoded = await decodeSocketAuthToken(token) as SocketUser;
      socket.data.user = decoded?.user;
      socket.data.matchingState = 'idle';
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.data?.user?.id) return;

    const userId = socket.data.user.id;
    console.log(`User connected: ${userId}`);

    // Store socket mapping
    connectedUsers.set(userId, socket.id);

    // Start finding match
    socket.on('findMatch', async (filters: MatchFilters) => {
      console.log("findMatch called:", { filters, userId });
      console.log("🚀 ~ socket.on ~ socket.data:", socket.data)
      
      try {
        // Validate state and call_type
        if (socket.data.matchingState !== 'idle') {
          socket.emit('error', { message: 'Already in matching or call' });
          return;
        }

        if (!filters.call_type || !['video', 'audio'].includes(filters.call_type)) {
          socket.emit('error', { message: 'Invalid call type' });
          return;
        }

        socket.data.matchingState = 'finding';
        socket.data.currentFilters = filters;

        // Add to matching queue
        await addToMatchingQueue(userId, filters);
        
        // Start match finding timeout
        const timeout = setTimeout(async () => {
          if (socket.data.matchingState === 'finding') {
            await removeFromQueue(userId);
            socket.data.matchingState = 'idle';
            socket.emit('noMatchesAvailable');
          }
        }, MATCH_TIMEOUT);

        socket.data.matchTimeout = timeout;

        // Try to find a match
        const match = await findMatch(userId, filters);
        if (match) {
          const matchedSocketId = connectedUsers.get(match.user_id);

          if (!matchedSocketId) {
            socket.emit('error', { message: 'Matched user not available' });
            return;
          }

          // Clear match finding timeout
          clearTimeout(socket.data.matchTimeout);
          
          // Create room
          const roomId = `match_${userId}_${match.user_id}`;
          socket.join(roomId);
          io.to(matchedSocketId).socketsJoin({roomId});

          // Update states
          socket.data.matchingState = 'in_call';
          io.to(matchedSocketId).emit('matchingState', 'in_call');

          const signalStarterUserId = Number(userId) < Number(match.user_id) ? Number(userId) : Number(match.user_id)
          const canStartSignaling = signalStarterUserId == Number(userId)
          const signalInitiateData = { 
            roomId, 
            userId: match.user_id,
            callType: filters.call_type,
            canStartSignaling,
          };

          io.to(roomId).emit('startSignaling', signalInitiateData );

          // Record match in history
          await startMatch(userId, match.user_id, filters.call_type);
        }
      } catch (error) {
        console.error('Error in findMatch:', error);
        socket.data.matchingState = 'idle';
        socket.emit('error', { message: 'Failed to start matching' });
      }
    });

    // Handle WebRTC signaling
    // socket.on('webrtcSignal', (data: { signal: any; roomId: string }) => {
    //   console.log("webrtcSignal:", { roomId: data.roomId, userId });
      
    //   if (socket.data.matchingState !== 'in_call') return;
      
    //   socket.to(data.roomId).emit('webrtcSignal', {
    //     signal: data.signal,
    //     from: userId
    //   });
    // });

    // Add type definition
    type SignalType = 'offer' | 'answer';

    // Update the event handler
    socket.on('webrtcSignal', (data: { 
        signal: any; 
        roomId: string; 
        to: number;
        type: SignalType 
    }) => {
        console.log("webrtcSignal:", { 
            data 
        });
        
        if (socket.data.matchingState !== 'in_call') return;

        const targetSocketId = connectedUsers.get(data.to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('webrtcSignal', {
                signal: data.signal,
                from: userId,
                type: data.type    // Forward the signal type
            });
        }
    });

    // Handle end session
    socket.on('endSession', async (roomId: string) => {
      console.log("endSession:", { roomId, userId });
      
      try {
        // Clear timeout if in finding state
        if (socket.data.matchTimeout) {
          clearTimeout(socket.data.matchTimeout);
        }

        // Remove from queue if in finding state
        if (socket.data.matchingState === 'finding') {
          await removeFromQueue(userId);
        }

        // If in room, notify other user
        if (roomId) {
          socket.to(roomId).emit('sessionEnded', {
            userId,
            reason: 'user_ended'
          });

          // Leave room
          socket.leave(roomId);
        }

        // Reset state
        socket.data.matchingState = 'idle';
        socket.emit('sessionEnded', { reason: 'self_ended' });

      } catch (error) {
        console.error('Error in endSession:', error);
        socket.emit('error', { message: 'Failed to end session' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log("disconnect:", { userId });
      
      try {
        connectedUsers.delete(userId);
        
        if (socket.data.matchTimeout) {
          clearTimeout(socket.data.matchTimeout);
        }

        if (socket.data.matchingState === 'finding') {
          await removeFromQueue(userId);
        }

        // Notify rooms if any
        socket.rooms.forEach(roomId => {
          if (roomId.startsWith('match_')) {
            socket.to(roomId).emit('sessionEnded', {
              userId,
              reason: 'user_disconnected'
            });
          }
        });
      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    });
  });

  return io;
};