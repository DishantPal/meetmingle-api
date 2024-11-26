import { Hono } from 'hono'
import { logger } from 'hono/logger'
import type { Context } from 'hono'
import { Env } from './types/app.js'





// Define the custom context type
// type CustomContext = Context<{
//   Variables: Variables
// }>

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'

const ParamsSchema = z.object({
  id: z
    .string()
    .min(3)
    .openapi({
      param: {
        name: 'id',
        in: 'path',
      },
      example: '1212121',
    }),
})

const UserSchema = z
  .object({
    id: z.string().openapi({
      example: '123',
    }),
    name: z.string().openapi({
      example: 'John Doe',
    }),
    age: z.number().openapi({
      example: 42,
    }),
  })
  .openapi('User')

  const route = createRoute({
    method: 'get',
    path: '/users/{id}',
    request: {
      params: ParamsSchema,
    },
    tags: ['users'],
    responses: {
      200: {
        content: {
          'application/json': {
            schema: UserSchema,
          },
        },
        description: 'Retrieve the user',
      },
    },
  })

  export const app = new OpenAPIHono()

  app.openapi(route, (c) => {
    const { id } = c.req.valid('param')
    return c.json(
      {
        id,
        age: 20,
        name: 'Ultra-man',
      },
      200 // You should specify the status code even if it is 200.
    )
  })

  const commonModulesList = [
    { name: 'me', description: 'Current user endpoints. They are split from `users` due to a different authorization flow.' },
    { name: 'users', description: '`user` is also an entity, but NOT a contextual entity.' },
    {
      name: 'memberships',
      description:
        'Organization-scope only. Memberships are one-on-one relations between a user and a contextual entity, such as an organization or project. It contains a role and archived, muted status.',
    },
    { name: 'organizations', description: 'Organizations - `organization` - are obviously a central `entity`.' },
    { name: 'requests', description: 'Receive public requests such as contact form, newsletter and waitlist requests.' },
    { name: 'general', description: 'Endpoints that are system-wide, system related or span multiple entities.' },
    {
      name: 'auth',
      description:
        'Multiple authentication methods are included: email/password combination, OAuth with Github. Other Oauth providers and passkey support are work in progress.',
    },
    { name: 'attachments', description: 'Be able to leverage different attachment types within an entity.' },
    { name: 'metrics', description: 'Observability endpoints.' },
  ];

  const registry = app.openAPIRegistry;
  registry.registerComponent('securitySchemes', 'cookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: `slug-session-v1.1.1`,
    description:
      "Authentication cookie. Copy the cookie from your network tab and paste it here. If you don't have it, you need to sign in or sign up first.",
  });
  
  const tags = commonModulesList;


  app.doc('/openapi.json', {
    servers: [{ url: 'http://localhost:3000' }],
    info: {
      title: `App API`,
      version: 'v1.1.1',
      description: 'This is apps description',
    },
    openapi: '3.1.0',
    tags,
    security: [{ cookieAuth: [] }],
  })

  app.get(
    '/docs',
    apiReference({
      spec: {
        url: '/openapi.json',
      },
    }),
  )

// export const app = new Hono<Env>()

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
// app.use(async (c, next) => {
//   c.set('user', { id: 'guest' })
//   await next()
// })

// import { rateLimiter } from "hono-rate-limiter";
// import { z } from 'zod'

// const limiter = rateLimiter({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
//   standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
//   keyGenerator: (c: CustomContext) => {
//     const ip = c.req.header('x-forwarded-for')
//     const user = c.get('user').id || 'guest'
//     const key = `${ip}-${user}`;

//     console.log("🚀 ~ key:", key)
//     return key;
//   },
// });
// // Apply the rate limiting middleware to all requests.
// app.use(limiter);




app.get('/', (c) => {
  return c.json({"msg": "Hello World"})
})