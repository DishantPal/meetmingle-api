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

// type MatchingState = 'idle' | 'finding' | 'in_call';

interface AuthenticatedSocket extends Socket {
  data: {
    user: SocketUser;
    // matchTimeout?: NodeJS.Timeout;
    // matchingState: MatchingState;
    currentFilters?: MatchFilters;
  };
}

// Store connected users and their socket IDs
const connectedUsers = new Map<number, string>();

// const MATCH_TIMEOUT = 30000; // 30 seconds to find match

export const setupMatchSocket = (app: CustomHono) => {
  const io = new Server({
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/match",
    transports: ['websocket', 'polling'], // Allow both WebSocket and polling
  });

  // JWT Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Token required'));

      const decoded = await decodeSocketAuthToken(token) as SocketUser;
      socket.data.user = decoded?.user;
      // socket.data.matchingState = 'idle';
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
      console.log("🚀 ~ socket.on ~ socket.data:", socket.data);

      try {
        // Validate state and call_type
        // if (socket.data.matchingState !== 'idle') {
          // socket.emit('error', { message: 'Already in matching or call' });
          // return;
        // }

        if (!filters.call_type || !['video', 'audio'].includes(filters.call_type)) {
          socket.emit('error', { message: 'Invalid call type' });
          return;
        }

        // socket.data.matchingState = 'finding';
        socket.data.currentFilters = filters;

        // Add to matching queue
        await addToMatchingQueue(userId, filters);

        // // Start match finding timeout
        // const timeout = setTimeout(async () => {
        //   if (socket.data.matchingState === 'finding') {
        //     await removeFromQueue(userId);
        //     socket.data.matchingState = 'idle';
        //     socket.emit('noMatchesAvailable');
        //   }
        // }, MATCH_TIMEOUT);

        // socket.data.matchTimeout = timeout;

        // Try to find a match
        const match = await findMatch(userId, filters);
        console.log("🚀 ~ socket.on ~ match:", match)
        if (match) {
          
          const matchedSocketId = connectedUsers.get(match.user_id);
          

          console.log('before not matchedSocketId')
          console.log("🚀 ~ socket.on ~ matchedSocketId:", matchedSocketId)
          if (!matchedSocketId) {
            console.log('after not matchedSocketId')
            socket.emit('error', { message: 'Matched user not available' });
            return;
          }

          socket.emit('xyz', {test: 123});
          io.to(matchedSocketId).emit('xyz', {test: 456})

          // Clear match finding timeout
          // clearTimeout(socket.data.matchTimeout);

          // Create room with sorted user IDs for consistency
          const [smallerId, largerId] = [userId, match.user_id]
            .map(Number)
            .sort((a, b) => a - b);
          const roomId = `match_${smallerId}_${largerId}`;

          // Join both users to room
          socket.join(roomId);
          io.to(matchedSocketId).socketsJoin(roomId);

          // Update states
          // socket.data.matchingState = 'in_call';
          // io.to(matchedSocketId).emit('matchingState', 'in_call');

          console.log("startSignaling calling current user : ", {
            userId, signalData: {
              roomId,
              userId: match.user_id,
              callType: filters.call_type,
              matchedUserId: match.user_id,
              canStartSignaling: [userId, match.user_id].map(Number).sort((a, b) => a - b)[0] === userId
            }
          })

          // send event to current connectedUser
          const cu = socket.emit('startSignaling', {
            roomId,
            userId: match.user_id,
            callType: filters.call_type,
            matchedUserId: match.user_id,
            canStartSignaling: [userId, match.user_id].map(Number).sort((a, b) => a - b)[0] === userId
          });

          console.log(cu);

          console.log("startSignaling calling matched user : ", {
            userId: match.user_id, signalData: {
              roomId,
              userId: userId,
              callType: filters.call_type,
              matchedUserId: userId,
              canStartSignaling: [userId, match.user_id].map(Number).sort((a, b) => a - b)[0] === match.user_id
            }
          })

          // send event to matched user
          const mu = io.to(matchedSocketId).emit('startSignaling', {
            roomId,
            userId: userId,
            callType: filters.call_type,
            matchedUserId: userId,
            canStartSignaling: [userId, match.user_id].map(Number).sort((a, b) => a - b)[0] === match.user_id
          });

          console.log(mu);

          // io.to(roomId).emit('startSignaling', signalInitiateData );

          // Record match in history
          await startMatch(userId, match.user_id, filters.call_type);
        }
      } catch (error) {
        console.error('Error in findMatch:', error);
        // socket.data.matchingState = 'idle';
        socket.emit('error', { message: 'Failed to start matching' });
      }
    });

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
        roomId: data.roomId, to: data.to, type: data.type
      });

      // if (socket.data.matchingState !== 'in_call') return;

      const targetSocketId = connectedUsers.get(data.to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtcSignal', {
          signal: data.signal,
          userId: userId,
          roomId: data.roomId,
          from: userId,
          type: data.type    // Forward the signal type
        });
      }
    });

    // Update the event handler
    socket.on('exchangeIceCandidate', (data: {
      signal: any;
      roomId: string;
      to: number;
      type: SignalType
    }) => {
      console.log("exchangeIceCandidate:", {
        roomId: data.roomId, to: data.to, type: data.type
      });

      const targetSocketId = connectedUsers.get(data.to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('exchangeIceCandidate', {
          signal: data.signal,
          userId: userId,
          roomId: data.roomId,
          from: userId,
          type: data.type
        });
      }
    });

    // Handle end session
    socket.on('endSession', async ({roomId}) => {
      console.log("endSession:", { roomId, userId });

      try {
        // Clear timeout if in finding state
        // if (socket.data.matchTimeout) {
        //   clearTimeout(socket.data.matchTimeout);
        // }

        // Remove from queue if in finding state
        // if (socket.data.matchingState === 'finding') {
          await removeFromQueue(userId);
        // }

        // If in room, notify other user
        if (roomId) {
          socket.to(roomId).emit('endSession', {
            userId,
            reason: 'user_ended'
          });

          // Leave room
          socket.leave(roomId);
        }

        // Reset state
        // socket.data.matchingState = 'idle';
        socket.emit('endSession', { reason: 'self_ended' });

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

        // if (socket.data.matchTimeout) {
        //   clearTimeout(socket.data.matchTimeout);
        // }

        // if (socket.data.matchingState === 'finding') {
          await removeFromQueue(userId);
        // }

        // Notify rooms if any
        socket.rooms.forEach(roomId => {
          if (roomId.startsWith('match_')) {
            socket.to(roomId).emit('endSession', {
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