import 'dotenv/config';
import { z } from 'zod';
const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    APP_NAME: z.string(),
    APP_KEY: z.string(),
    APP_ENV: z.enum(['local', 'production', 'development', 'test']),
    APP_DEBUG: z.string().transform((val) => val === 'true'),
    APP_TIMEZONE: z.string().default('UTC'),
    APP_URL: z.string().url(),
    DB_HOST: z.string(),
    DB_PORT: z.coerce.number().default(3306),
    DB_DATABASE: z.string(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
});
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error('Invalid environment variables:', parsedEnv.error.format());
    process.exit(1);
}
export const config = {
    app: {
        port: parsedEnv.data.PORT,
        name: parsedEnv.data.APP_NAME,
        key: parsedEnv.data.APP_KEY,
        env: parsedEnv.data.APP_ENV,
        debug: parsedEnv.data.APP_DEBUG,
        timezone: parsedEnv.data.APP_TIMEZONE,
        url: parsedEnv.data.APP_URL,
    },
    db: {
        host: parsedEnv.data.DB_HOST,
        port: parsedEnv.data.DB_PORT,
        database: parsedEnv.data.DB_DATABASE,
        username: parsedEnv.data.DB_USERNAME,
        password: parsedEnv.data.DB_PASSWORD,
    },
};
