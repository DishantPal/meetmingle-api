// src/modules/match/socket.ts
import { Server, Socket } from 'socket.io';
import { CustomHono } from '@/types/app.js';
import { addToMatchingQueue, removeFromQueue, findMatch, startMatch, getUserEmailFromId } from './match.service.js';
import { decodeSocketAuthToken } from './socketAuth.service.js';
import { PUSH_NOTIFICATION_TEMPLATES } from '@/config/pushNotificationTemplates.js';
import { sendOneSignalNotification } from '@/utils/onesignal.js';
import { getRandomFemaleName } from '@/utils/generateRandomFemaleName.js';

interface MatchFilters {
  call_type: 'video' | 'audio';
  gender?: string;
  preferred_language?: string;
  country?: string;
  state?: string;
  age?: string;
  age_min?: number;
  age_max?: number;
  interests?: string[];
  filters?: object;
}

interface SocketUser {
  id: number;
  email: string;
  user: any;
}

interface AuthenticatedSocket extends Socket {
  data: {
    user: SocketUser;
  };
}

// Store connected users and their socket IDs
const connectedUsers = new Map<number, string>();
const connectedUsersRooms = new Map<number, string>();

export const setupMatchSocket = (app: CustomHono) => {
  const io = new Server({
    path: "/match",
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // JWT Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Token required'));

      const decoded = await decodeSocketAuthToken(token) as SocketUser;
      if (!decoded?.user) return next(new Error('Invalid token'));

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

      if (filters.filters) filters = { ...filters, ...filters.filters }

      try {
        if (!filters.call_type || !['video', 'audio'].includes(filters.call_type)) {
          socket.emit('error', { message: 'Invalid call type' });
          return;
        }

        // Add to matching queue
        try {
          await addToMatchingQueue(userId, filters);
        } catch (error: any) {
          if (error.message == 'User already in queue') {
            socket.emit('error', { message: 'User already in queue' });
          }

          console.log('Socket Error', error);
        }

        // Try to find a match
        let match;
        try {
          match = await findMatch(userId, filters);
        } catch (error: any) {
          if (error.message == 'User does not have enough balance to use this filter') {
            socket.emit('error', { message: 'User does not have enough balance to use this filter' });
          }

          console.log('Socket Error', error);
          return;
        }

        console.log("🚀 ~ socket.on ~ match:", match)

        if (match) {

          const matchedSocketId = connectedUsers.get(match.user_id);

          console.log("🚀 ~ socket.on ~ matchedSocketId:", matchedSocketId)
          if (!matchedSocketId) {
            socket.emit('error', { message: 'Matched user not available' });
            return;
          }

          socket.emit('xyz', { test: 123 });
          io.to(matchedSocketId).emit('xyz', { test: 456 })

          // Create room with sorted user IDs for consistency
          const [smallerId, largerId] = [userId, match.user_id]
            .map(Number)
            .sort((a, b) => a - b);
          const roomId = `match_${smallerId}_${largerId}`;

          // Join both users to room
          socket.join(roomId);
          io.to(matchedSocketId).socketsJoin(roomId);

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

          connectedUsersRooms.set(userId, roomId);
          connectedUsersRooms.set(match.user_id, roomId);

          // Record match in history
          await startMatch(userId, match.user_id, filters.call_type);
        }
      } catch (error) {
        console.error('Error in findMatch:', error);
        socket.emit('error', { message: 'Failed to start matching' });
        return;
      }
    });

    // Add type definition
    type SignalType = 'offer' | 'answer';

    // Update the event handler
    socket.on('exchangeData', (data: {
      data: any;
      roomId: string;
      to: number;
      type: SignalType
    }) => {
      console.log("exchangeData:", {
        roomId: data.roomId, to: data.to, type: data.type
      });

      // if (socket.data.matchingState !== 'in_call') return;
      console.log('connectedUsers in exchangeData')
      console.log(connectedUsers)
      const targetSocketId = connectedUsers.get(data.to);
      console.log({ from: 'exchangeData', data: data.data, targetSocketId, data_to: data.to, type: data.type, room: data.roomId })
      if (targetSocketId) {
        io.to(targetSocketId).emit('exchangeData', {
          data: data.data,
          userId: userId,
          roomId: data.roomId,
          from: userId,
          type: data.type    // Forward the signal type
        });
      }
    });

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
      console.log('connectedUsers in webrtcSignal')
      console.log(connectedUsers)

      const targetSocketId = connectedUsers.get(data.to);
      console.log({ from: 'webrtcSignal', signal: data.signal, targetSocketId, data_to: data.to, type: data.type, room: data.roomId })
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

      console.log('connectedUsers in exchangeIceCandidate')
      console.log(connectedUsers)

      const targetSocketId = connectedUsers.get(data.to);
      console.log({ from: 'exchangeIceCandidate', signal: data.signal, targetSocketId, data_to: data.to, type: data.type, room: data.roomId })
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
    socket.on('endSession', async ({ roomId }) => {
      console.log("endSession:", { roomId, userId });

      try {
        await removeFromQueue(userId);

        const matchedRoomId = connectedUsersRooms.get(userId);

        connectedUsersRooms.delete(userId);

        // If in room, notify other user
        if (roomId) {
          socket.to(roomId).emit('endSession', {
            userId,
            reason: 'user_ended'
          });

          // Leave room
          socket.leave(roomId);

        }

        if (roomId == '' && matchedRoomId) {

          socket.to(matchedRoomId).emit('endSession', {
            userId,
            reason: 'user_ended'
          });

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

        await removeFromQueue(userId);

        const matchedRoomId = connectedUsersRooms.get(userId);

        if (matchedRoomId) {
          socket.to(matchedRoomId).emit('endSession', {
            userId,
            reason: 'user_ended'
          });
        }

        const userEmail = await getUserEmailFromId(userId);

        if (userEmail) {
          const femaleName = getRandomFemaleName();
          const template = PUSH_NOTIFICATION_TEMPLATES.female_waiting;
          sendOneSignalNotification(
            userEmail,
            template.title.replace('[FEMALE NAME]', femaleName),
            template.content,
            template.url,
            template.delay
          );
        }


      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    });
  });

  return io;
};