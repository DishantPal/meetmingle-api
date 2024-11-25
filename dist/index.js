import { Hono } from 'hono';
import { logger } from 'hono/logger';
export const app = new Hono();
app.use(logger());
app.use(async (c, next) => {
    c.set('user', { id: 'guest' });
    await next();
});
import { rateLimiter } from "hono-rate-limiter";
const limiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-6",
    keyGenerator: (c) => {
        const ip = c.req.header('x-forwarded-for');
        const user = c.get('user').id || 'guest';
        const key = `${ip}-${user}`;
        console.log("🚀 ~ key:", key);
        return key;
    },
});
app.use(limiter);
app.get('/', (c) => {
    return c.json({ "msg": "Hello World" });
});
