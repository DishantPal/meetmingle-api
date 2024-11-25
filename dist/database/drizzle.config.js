import { defineConfig } from 'drizzle-kit';
import { config } from '@/config/index.js';
const dbConfig = {
    host: config.db.host,
    port: config.db.port,
    user: config.db.username,
    password: config.db.password,
    database: config.db.database,
};
export default defineConfig({
    out: './database/migrations',
    schema: './database/schemas',
    dialect: 'mysql',
    dbCredentials: dbConfig,
});
