import { Hono } from 'hono'
import { logger } from 'hono/logger'

// import { rateLimiter } from "hono-rate-limiter";
// import { getConnInfo } from '@hono/node-server/conninfo'


// const limiter = rateLimiter({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
//   standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
//   keyGenerator: (c) => {
//     const info = getConnInfo(c) // info is `ConnInfo`
//     return info.remote.address;
//   },
// });

export const app = new Hono()

app.use(logger())

// Apply the rate limiting middleware to all requests.
// app.use(limiter);


app.get('/', (c) => {
  return c.json({"msg": "Hello World"})
})