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
import { endMatch } from "./match.service.js"
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

// WebSocket documentation route
const websocketDocsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: [moduleTag],
  description: `
    WebSocket endpoint for video/audio matching functionality.
    
    Connect via Socket.IO:
    \`\`\`javascript
    const socket = io('http://your-server', {
      path: '/match',
      auth: { token: 'your-jwt-token' }
    });
    \`\`\`

    Events:
    Client → Server:
    - findMatch: Start searching for match
      \`socket.emit('findMatch', { call_type: 'video'|'audio', filters })\`
    - webrtcSignal: Exchange WebRTC signals
      \`socket.emit('webrtcSignal', { signal, roomId })\`
    - rejectMatch: Reject current match
      \`socket.emit('rejectMatch', roomId)\`
    - endCall: End current call
      \`socket.emit('endCall', roomId)\`
    
    Server → Client:
    - matchFound: Match found with user
      \`{ roomId: string, userId: number, callType: string }\`
    - noMatchesAvailable: No match found in 30s
    - matchRejected: Other user rejected match
    - callEnded: Other user ended call
    - peerDisconnected: Other user disconnected
    - error: Any error messages
  `,
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

// Force end current match (for safety/moderation)
const endCurrentMatchRoute = createRoute({
  method: 'post',
  path: '/end-match',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  request: {
    body: createJsonBody(z.object({
      user_id: z.number()
        .openapi({ example: 123, description: 'ID of other user in match' })
    }))
  },
  responses: {
    200: createSuccessRouteDefinition(
      z.object({}),
      'Match ended successfully'
    ),
    ...defaultResponses
  }
})

app.openapi(endCurrentMatchRoute, async (c) => {
  const { user_id: otherUserId } = c.req.valid('json')
  const currentUserId = c.get('user').id

  await endMatch(currentUserId, otherUserId, 'force_ended')
  
  return sendSuccess(c, {}, 'Match ended successfully')
})

// Function to integrate Socket.IO with Hono
export const setupMatchModule = (app: CustomHono) => {
  const io = setupMatchSocket(app)
  return io
}