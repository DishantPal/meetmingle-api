import { serve } from '@hono/node-server'

import app from "./app.js"
import { config } from './config/index.js';
import { setupMatchModule } from './modules/match/index.js';


const port = config.app.port;
console.log(`Server is running. Docs on http://localhost:${port}/docs`)

const server = serve({
  fetch: app.fetch,
  port
})

// Setup WebSocket
const io = setupMatchModule(app)
// io.attach(server)

io.attach(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["auth-token", "Content-Type"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});