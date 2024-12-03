import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';

import { config } from '@/config/index.js';
import { DB } from './db.js';


// Define the database interface

// Create the database connection
export const db = new Kysely<DB>({
  dialect: new MysqlDialect({
    pool: createPool({
        uri: config.db.database_url
    })
  })
});