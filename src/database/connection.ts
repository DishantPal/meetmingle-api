import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { config } from '@/config/index.js';

const dbConfig = {
    host: config.db.host,
    port: config.db.port,
    user: config.db.username,
    password: config.db.password,
    database: config.db.database,
}

const pool = mysql.createPool(dbConfig);

export const db = drizzle({ client: pool });

export const getPool = () => pool;

export async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to the database.');
        connection.release();
        return true;
    } catch (error) {
        console.error('Error connecting to the database:', error);
        return false;
    }
}