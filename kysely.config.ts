import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import { defineConfig } from "kysely-ctl";

import { DB } from './src/database/db';

import 'dotenv/config'

// Create the database connection
const db = new Kysely<DB>({
	dialect: new MysqlDialect({
	  pool: createPool({
		  uri: process.env.DATABASE_URL
	  })
	})
  });

export default defineConfig({
  kysely: db,
  migrations: {
	migrationFolder: 'src/database/migrations',
  }
});