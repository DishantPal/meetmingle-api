import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create users table
  await db.schema
    .createTable('users')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('email', 'varchar(255)')
    .addColumn('provider_type', 'varchar(50)')
    .addColumn('provider_id', 'varchar(255)')
    .addColumn('email_verified_at', 'timestamp')
    .addColumn('password_hash', 'varchar(255)')
    .addColumn('is_banned', 'boolean', (col) => 
      col.notNull().defaultTo(false)
    )
    .addColumn('ban_reason', 'text')
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('deleted_at', 'timestamp')
    .execute()

  // Add unique constraint on email
  await db.schema
    .alterTable('users')
    .addUniqueConstraint('users_email_unique', ['email'])
    .execute()

  // Create composite index on email and deleted_at
  await db.schema
    .createIndex('idx_users_email')
    .on('users')
    .columns(['email', 'deleted_at'])
    .execute()

  // Create composite index on provider fields and deleted_at
  await db.schema
    .createIndex('idx_users_provider')
    .on('users')
    .columns(['provider_type', 'provider_id', 'deleted_at'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
}