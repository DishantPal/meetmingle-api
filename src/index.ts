import { serve } from '@hono/node-server'

import {app} from "./app.js"
import { config } from './config/index.js';


const port = config.app.port;
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
