import 'dotenv/config'
import { z } from 'zod'

// Define a schema for environment variables
const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    
    APP_NAME: z.string(),
    APP_KEY: z.string(),
    APP_ENV: z.enum(['local', 'production', 'development','test']),
    APP_DEBUG: z.string().transform((val) => val === 'true'),
    APP_TIMEZONE: z.string().default('UTC'),
    APP_URL: z.string().url(),

    DB_HOST: z.string(),
    DB_PORT: z.coerce.number().default(3306),
    DB_DATABASE: z.string(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    
    // Uncomment if using Redis
    // REDIS_CLIENT: z.string().optional(),
    // REDIS_HOST: z.string().optional(),
    // REDIS_PASSWORD: z.string().optional(),
    // REDIS_PORT: z.string().optional(),
    
    // Uncomment if using Mail
    // MAIL_MAILER: z.string().optional(),
    // MAIL_HOST: z.string().optional(),
    // MAIL_PORT: z.string().optional(),
    // MAIL_USERNAME: z.string().optional(),
    // MAIL_PASSWORD: z.string().optional(),
    // MAIL_ENCRYPTION: z.string().optional(),
    // MAIL_FROM_ADDRESS: z.string().optional(),
    // MAIL_FROM_NAME: z.string().optional(),
})

// Validate environment variables
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
    console.error('Invalid environment variables:', parsedEnv.error.format())
    process.exit(1)
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
    // Uncomment and add Redis configuration if needed
    // redis: {
    //     client: parsedEnv.data.REDIS_CLIENT,
    //     host: parsedEnv.data.REDIS_HOST,
    //     password: parsedEnv.data.REDIS_PASSWORD,
    //     port: parsedEnv.data.REDIS_PORT,
    // },
    // Uncomment and add Mail configuration if needed
    // mail: {
    //     mailer: parsedEnv.data.MAIL_MAILER,
    //     host: parsedEnv.data.MAIL_HOST,
    //     port: parsedEnv.data.MAIL_PORT,
    //     username: parsedEnv.data.MAIL_USERNAME,
    //     password: parsedEnv.data.MAIL_PASSWORD,
    //     encryption: parsedEnv.data.MAIL_ENCRYPTION,
    //     fromAddress: parsedEnv.data.MAIL_FROM_ADDRESS,
    //     fromName: parsedEnv.data.MAIL_FROM_NAME,
    // },
}