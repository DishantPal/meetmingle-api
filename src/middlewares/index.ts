import { CustomHono, Env } from "@/types/app.js";
import { Context } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "./requestId.js";

// const app = new CustomHono();

const applyGlobalMiddlewares = (app: CustomHono) => {
    // Secure headers
    app.use('*', secureHeaders());

    // Health check for render.com
    app.get('/ping', (c) => c.text('pong'));


    // Logger
    app.use('*', logger());

    // Request Id
    app.use('*', requestId);


    // Cors Middleware
    const corsOptions: Parameters<typeof cors>[0] = {
        origin: "*",
        credentials: true,
        allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
        allowHeaders: [],
    };
    app.use('*', cors(corsOptions));

    // Rate limiter
    const limiter = rateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
        standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
        keyGenerator: (c: Context<Env>) => {
            const ip = c.req.header('x-forwarded-for')
            // const user = c.get('user').id || 'guest'
            // const key = `${ip}-${user}`;
            const key = `${ip}`;

            console.log("🚀 ~ key:", key)
            return key;
        },
    });
    // Apply the rate limiting middleware to all requests.
    app.use(limiter);
}

export default applyGlobalMiddlewares;