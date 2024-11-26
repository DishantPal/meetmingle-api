Checkout: 

Figma: https://www.figma.com/design/7P834h6tL4XOsIHwIuNsEi/Random-video-Chat-Dating-App---Client?node-id=0-1&node-type=canvas&t=nxMaYG2jjUJeMHbk-0


https://github.com/OultimoCoder/cloudflare-planetscale-hono-boilerplate
https://github.com/cellajs/cella
https://github.com/w3cj/hono-open-api-starter

API Doc Ref: https://snorkell.apidocumentation.com/reference



1.  ctx.set('user', user);
on invalid session remove cookie + other stuffs

2. error and not found handlers

3. security headers



===

1. req tracing
2. notfound and onerror
3. error handler
   1. error type conversion
   2. sentry
   3. delete c.error
4. ratelimiter
5. client ip /country/local/etc
6. sentry
7. cors
8. common success and error response
9. change entry point to index
10. structure:
    1.  index.js for serving app
    2.  app.js for app scafolding
        1.  start hono app
        2.  register global middleware
            1.  secure headers
            2.  cors
            3.  logger
            4.  rate limiter
            5.  tracing
            6.  client details
            7.  no bot middleware
        3.  register health route
        4.  register docs
        5.  register not found
        6.  register error handler
    3.  middlewares
        1.  rate limiter
        2.  tracing -- tag as global use
        3.  client details -- tag as global use
        4.  auth
        5.  membership
        6.  auth:scope -- only example
        7.  error handler -- tag as global use
    4.  lib
        1. mailerService
        2. onesignalService
        3. otpService (TOTP & HOTP)
        4. errorResponse
           1. normal error
           2. validation error
           3. internal error
        5. successResponse
           1. normal resp
           2. paginated resp
    5. types
       1. app.ts
       2. commons.ts
    6. config
    7. database
    8. utils
       1. omitKeys
       2. nanoid
       3. paginate
       4. other shared logic
    9. modules
       1.  auth
           1.  index.ts
               1.  custom hono app
                   1.  config like path, method, middleware, etc from openai spec
                   2.  handler
           2.  services.ts
           3.  schema.ts
           4.  routes.ts openai config + path, method, middleware, request schema, response schema
           5.  helpers/
               1.  if required for complex logic (not shared logic)
       2.  user
       3.  coins
       4.  subscription
       5.  ...