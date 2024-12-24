// src/modules/match/socket.ts
import { Server, Socket } from 'socket.io';
import { Hono } from 'hono';
import { addToMatchingQueue, removeFromQueue, findMatch } from './match.service.js';
import { decodeSocketAuthToken } from './socketAuth.service.js';
import { CustomHono } from '@/types/app.js';

interface MatchFilters {
  call_type: 'video' | 'audio';  // mandatory
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

interface AuthenticatedSocket extends Socket {
  data: {
    user: SocketUser;
    matchTimeout?: NodeJS.Timeout;
  };
}

const connectedUsers = new Map<number, string>();

export const setupMatchSocket = (app: CustomHono) => {
  const io = new Server({
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"]
    },
    path: "/match"
  });

  // JWT Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Token required'));
      }

      const decoded = await decodeSocketAuthToken(token) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.data.user.id}`);

    // Store socket mapping when user connects
    connectedUsers.set(socket.data.user.id, socket.id);

    // Start finding match
    socket.on('findMatch', async (filters: MatchFilters) => {
      try {
        const userId = socket.data.user.id;
        console.log(`Finding match for user ${userId} with filters:`, filters);

        // Validate call_type
        if (!filters.call_type || !['video', 'audio'].includes(filters.call_type)) {
          socket.emit('error', { message: 'Invalid call type' });
          return;
        }

        // Add to matching queue
        await addToMatchingQueue(userId, filters);
        
        // Start 30s timeout for finding match
        const timeout = setTimeout(async () => {
          await removeFromQueue(userId);
          socket.emit('noMatchesAvailable');
        }, 30000);

        socket.data.matchTimeout = timeout;

        // Try to find a match
        const match = await findMatch(userId, filters);
        if (match) {
          const matchedSocketId = connectedUsers.get(match.user_id);

          if (!matchedSocketId) {
            socket.emit('error', { message: 'Matched user is no longer available' });
            return;
          }

          // Clear timeout as match found
          clearTimeout(socket.data.matchTimeout);
          
          // Create room for these users
          const roomId = `match_${userId}_${match.user_id}`;
          
          // Join room
          socket.join(roomId);
          io.to(matchedSocketId).socketsJoin(roomId);

          // Notify both users
          socket.emit('matchFound', { 
            roomId, 
            userId: match.user_id,
            callType: filters.call_type
          });
          io.to(matchedSocketId).emit('matchFound', { 
            roomId, 
            userId,
            callType: filters.call_type
          });
        }
      } catch (error) {
        console.error('Error in findMatch:', error);
        socket.emit('error', { message: 'Failed to start matching' });
      }
    });

    // Handle WebRTC signaling
    socket.on('webrtcSignal', (data: { signal: any; roomId: string }) => {
      console.log(`Forwarding WebRTC signal in room: ${data.roomId}`);
      socket.to(data.roomId).emit('webrtcSignal', {
        signal: data.signal,
        from: socket.data.user.id
      });
    });

    // Handle match rejection
    socket.on('rejectMatch', async (roomId: string) => {
      try {
        console.log(`User ${socket.data.user.id} rejected match in room: ${roomId}`);
        
        // Notify other user
        socket.to(roomId).emit('matchRejected', {
          userId: socket.data.user.id
        });

        // Leave room
        const room = await io.in(roomId).fetchSockets();
        room.forEach(member => {
          member.leave(roomId);
        });

      } catch (error) {
        console.error('Error in rejectMatch:', error);
      }
    });

    // Handle call end
    socket.on('endCall', async (roomId: string) => {
      try {
        console.log(`Call ended in room: ${roomId}`);
        
        // Notify other user
        socket.to(roomId).emit('callEnded', {
          userId: socket.data.user.id
        });

        // Cleanup room
        const room = await io.in(roomId).fetchSockets();
        room.forEach(member => {
          member.leave(roomId);
        });

      } catch (error) {
        console.error('Error in endCall:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        // Remove from map on disconnect
        connectedUsers.delete(socket.data.user.id);

        console.log(`User disconnected: ${socket.data.user.id}`);
        
        // Clear any pending timeouts
        if (socket.data.matchTimeout) {
          clearTimeout(socket.data.matchTimeout);
        }

        // Remove from queue if present
        await removeFromQueue(socket.data.user.id);

        // Notify any matched users
        const rooms = socket.rooms;
        rooms.forEach(roomId => {
          if (roomId.startsWith('match_')) {
            socket.to(roomId).emit('peerDisconnected', {
              userId: socket.data.user.id
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