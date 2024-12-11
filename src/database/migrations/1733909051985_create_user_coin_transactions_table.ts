import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_coin_transactions')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('transaction_id', 'varchar(50)', (col) =>
      col.notNull().unique()
    )
    .addColumn('user_id', 'bigint', (col) =>
      col.notNull()
    )
    .addColumn('transaction_type', sql`enum('credit', 'debit')`, (col) =>
      col.notNull()
    )
    .addColumn('action_type', 'varchar(30)', (col) =>
      col.notNull()
    )
    .addColumn('amount', 'integer', (col) =>
      col.notNull()
    )
    .addColumn('running_balance', 'bigint', (col) =>
      col.notNull()
    )
    .addColumn('description', 'varchar(255)', (col) =>
      col.notNull()
    )
    .addColumn('user_note', 'text')
    .addColumn('admin_note', 'text')
    .addColumn('reference_id', 'varchar(100)')
    .addColumn('checksum', 'varchar(64)', (col) =>
      col.notNull()
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  await db.schema
    .createIndex('idx_transaction_id')
    .on('user_coin_transactions')
    .columns(['transaction_id'])
    .unique()
    .execute()

  await db.schema
    .createIndex('idx_user_transactions')
    .on('user_coin_transactions')
    .columns(['user_id', 'created_at'])
    .execute()

  await db.schema
    .createIndex('idx_transactions_action_type')
    .on('user_coin_transactions')
    .columns(['action_type'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_coin_transactions').execute()
}