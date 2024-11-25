import { Hono } from 'hono'
import { logger } from 'hono/logger'
import type { Context } from 'hono'



type User = {
  id: string
}

type Variables = {
  user: User
}

// Define the custom context type
type CustomContext = Context<{
  Variables: Variables
}>

export const app = new Hono<{Variables: Variables}>()

app.use(logger())

// import { getContext } from 'hono/context-storage';


// Not Needed as its called from the react native
// import { cors } from 'hono/cors'
// const corsOptions: Parameters<typeof cors>[0] = {
//   origin: "*",
//   credentials: true,
//   allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
//   allowHeaders: [],
// };
// app.use('*', cors(corsOptions));

// Apply the rate limiting middleware to all requests.
app.use(async (c, next) => {
  c.set('user', { id: 'guest' })
  await next()
})

import { rateLimiter } from "hono-rate-limiter";

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  keyGenerator: (c: CustomContext) => {
    const ip = c.req.header('x-forwarded-for')
    const user = c.get('user').id || 'guest'
    const key = `${ip}-${user}`;

    console.log("🚀 ~ key:", key)
    return key;
  },
});
// Apply the rate limiting middleware to all requests.
app.use(limiter);


app.get('/', (c) => {
  return c.json({"msg": "Hello World"})
})