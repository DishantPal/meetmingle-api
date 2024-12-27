// src/modules/match/index.ts
import { CustomHono } from "@/types/app.js"
import { createSuccessRouteDefinition, defaultResponses, sendSuccess, AppError, createJsonBody } from "@/utils/response.js"
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"
import { isAuthenticated } from "@/middlewares/authenticated.js"
import { CustomHonoAppFactory } from "@/utils/customHonoAppFactory.js"
import { StatusCodes } from "http-status-codes"
import { ERROR_CODES } from "@/utils/response.js"
import { setupMatchSocket } from "./socket.js"
import { db } from "@/database/database.js"

const app = CustomHonoAppFactory()
export { app as matchRoutes }

const moduleTag = 'match'

// Schema for match history response
const matchHistorySchema = z.object({
  id: z.number(),
  user1_id: z.number(),
  user2_id: z.number(),
  call_type: z.enum(['video', 'audio']),
  start_time: z.string(),
  end_time: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  end_reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
}).openapi({
  example: {
    id: 1,
    user1_id: 100,
    user2_id: 101,
    call_type: 'video',
    start_time: '2024-03-24T10:00:00Z',
    end_time: '2024-03-24T10:15:00Z',
    duration_seconds: 900,
    end_reason: 'completed',
    created_at: '2024-03-24T10:00:00Z',
    updated_at: '2024-03-24T10:15:00Z'
  }
})

const matchEndpointDescription = `
WebSocket endpoint for video/audio matching functionality.

Connection:
\`\`\`javascript
const socket = io('http://your-server', {
  path: '/match',
  auth: { token: 'your-jwt-token' }
});
\`\`\`

Flow Diagram:
\`\`\`mermaid
sequenceDiagram
    participant User1
    participant Server
    participant User2

    Note over User1,User2: Starting Match Journey
    User1->>Server: findMatch()
    User2->>Server: findMatch()
    
    Server->>User1: matchFound
    Server->>User2: matchFound

    Note over Server: Start 30s Accept Timer

    alt Both Accept Within 30s
        User1->>Server: acceptMatch()
        User2->>Server: acceptMatch()
        Server->>User1: startWebRTC
        Server->>User2: startWebRTC
        Note over User1,User2: Call Started
        
        alt End Session
            User1->>Server: endSession(roomId)
            Server->>User1: sessionEnded(reason: 'self_ended')
            Server->>User2: sessionEnded(reason: 'user_ended')
            Note over User1,User2: Both Exit Journey
        end
    
    else Only One Accepts (Timeout)
        User1->>Server: acceptMatch()
        Note over Server: Wait for User2
        Note over Server: 30s Timer Expires
        Server->>User1: acceptTimeout
        Server->>User2: acceptTimeout
        Note over User1,User2: Both Back to Finding
    
    else Reject Match
        User1->>Server: endSession()
        Server->>User2: sessionEnded
        Note over User1: Exits Journey
        Note over User2: Back to Finding
    
    else End Session Anytime
        User1->>Server: endSession()
        Server->>User1: sessionEnded(reason: 'self_ended')
        alt If Matched
            Server->>User2: sessionEnded(reason: 'user_ended')
        end
        Note over User1: Exits Journey
    end
\`\`\`

Events (Client → Server):
- findMatch: Start searching for match
  \`socket.emit('findMatch', { call_type: 'video'|'audio', filters })\`
  filters: {
    gender?: string,
    preferred_language?: string,
    country?: string,
    age_min?: number,
    age_max?: number,
    interests?: string[]
  }

- acceptMatch: Accept found match
  \`socket.emit('acceptMatch', roomId)\`

- webrtcSignal: Exchange WebRTC signals
  \`socket.emit('webrtcSignal', { signal, roomId })\`

- endSession: End matching/call at any point
  \`socket.emit('endSession', roomId?)\`

Events (Server → Client):
- matchFound: Match found, waiting for both to accept
  \`{ roomId: string, userId: number, callType: 'video'|'audio' }\`

- acceptTimeout: 30s accept timer expired
  \`{ reason: 'accept_timeout' }\`

- startWebRTC: Both users accepted, start WebRTC
  \`{ roomId: string }\`

- sessionEnded: Session ended
  \`{ userId: number, reason: 'user_ended'|'user_disconnected' }\`

- noMatchesAvailable: No match found in 30s

- error: Any error messages
  \`{ message: string }\`

States:
- idle: Initial state, can start matching
- finding: Searching for match (30s timeout)
- waiting_accept: Match found, waiting for accepts (30s timeout)
- in_call: Both accepted, call in progress

Timeouts:
- Match Finding: 30 seconds to find a match
- Match Accept: 30 seconds for both users to accept
- Each state transition is triggered by events from either client or server

Note: 
- All timeouts are 30 seconds
- Users can end session at any point
- Both users must accept within timeout for call to start
- WebRTC signaling starts only after both users accept
`;

// WebSocket documentation route
const websocketDocsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: [moduleTag],
  description: matchEndpointDescription,
  responses: {
    400: {
      description: 'This is a WebSocket endpoint, HTTP requests not supported'
    }
  }
})

app.openapi(websocketDocsRoute, (c) => {
  return c.json(
    { error: 'This endpoint requires WebSocket connection' }, 
    400
  )
})

// Get user's match history
const matchHistoryParamsSchema = z.object({
  limit: z.string()
    .transform(val => parseInt(val, 10))
    .openapi({ example: '10' })
})

const getMatchHistoryRoute = createRoute({
  method: 'get',
  path: '/history',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  request: {
    query: matchHistoryParamsSchema
  },
  responses: {
    200: createSuccessRouteDefinition(
      z.array(matchHistorySchema),
      'Match history retrieved successfully'
    ),
    ...defaultResponses
  }
})

app.openapi(getMatchHistoryRoute, async (c) => {
  const { limit } = c.req.valid('query')
  const userId = c.get('user').id

  const history = await db
    .selectFrom('match_history')
    .selectAll()
    .where(eb => eb.or([
      eb('user1_id', '=', userId),
      eb('user2_id', '=', userId)
    ]))
    .orderBy('created_at', 'desc')
    .limit(limit)
    .execute()

  return sendSuccess(c, history, 'Match history retrieved successfully')
})

// // Force end current match (for safety/moderation)
// const endCurrentMatchRoute = createRoute({
//   method: 'post',
//   path: '/end-match',
//   tags: [moduleTag],
//   security: [{ bearerAuth: [] }],
//   middleware: [isAuthenticated] as const,
//   request: {
//     body: createJsonBody(z.object({
//       user_id: z.number()
//         .openapi({ example: 123, description: 'ID of other user in match' })
//     }))
//   },
//   responses: {
//     200: createSuccessRouteDefinition(
//       z.object({}),
//       'Match ended successfully'
//     ),
//     ...defaultResponses
//   }
// })

// app.openapi(endCurrentMatchRoute, async (c) => {
//   const { user_id: otherUserId } = c.req.valid('json')
//   const currentUserId = c.get('user').id

//   await endMatch(currentUserId, otherUserId, 'force_ended')
  
//   return sendSuccess(c, {}, 'Match ended successfully')
// })

// Function to integrate Socket.IO with Hono
export const setupMatchModule = (app: CustomHono) => {
  const io = setupMatchSocket(app)
  return io
}