import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create subscription_plans table
  await db.schema
    .createTable('subscription_plans')
    .addColumn('id', 'bigint', col => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('code', 'varchar(50)', col => 
      col.notNull().unique()
    )
    .addColumn('name', 'varchar(100)', col => 
      col.notNull()
    )
    .addColumn('description', 'text')
    .addColumn('duration_days', 'integer', col => 
      col.notNull()
    )
    .addColumn('price', 'decimal(10, 2)', col => 
      col.notNull()
    )
    .addColumn('icon', 'varchar(255)')
    .addColumn('is_active', 'boolean', col => 
      col.notNull().defaultTo(true)
    )
    .addColumn('store_product_id_ios', 'varchar(100)')
    .addColumn('store_product_id_android', 'varchar(100)')
    .addColumn('created_at', 'timestamp', col => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', col => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  // Create indexes for subscription_plans
  await db.schema
    .createIndex('idx_subscription_plans_code')
    .on('subscription_plans')
    .column('code')
    .execute()

  // Create subscription_plan_features table
  await db.schema
    .createTable('subscription_plan_features')
    .addColumn('id', 'bigint', col => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('plan_id', 'bigint', col => 
      col.notNull().references('subscription_plans.id')
    )
    .addColumn('code', 'varchar(50)', col => 
      col.notNull()
    )
    .addColumn('name', 'varchar(100)', col => 
      col.notNull()
    )
    .addColumn('description', 'text')
    .addColumn('icon', 'varchar(255)')
    .addColumn('feature_value', 'varchar(255)')
    .addColumn('is_active', 'boolean', col => 
      col.notNull().defaultTo(true)
    )
    .addColumn('created_at', 'timestamp', col => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', col => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  // Create indexes for subscription_plan_features
  await db.schema
    .createIndex('idx_subscription_plan_features_plan_id')
    .on('subscription_plan_features')
    .column('plan_id')
    .execute()

  await db.schema
    .createIndex('idx_subscription_plan_features_code')
    .on('subscription_plan_features')
    .column('code')
    .execute()

  // Create user_subscriptions table
  await db.schema
    .createTable('user_subscriptions')
    .addColumn('id', 'bigint', col => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('user_id', 'bigint', col => 
      col.notNull().references('users.id')
    )
    .addColumn('plan_id', 'bigint', col => 
      col.notNull().references('subscription_plans.id')
    )
    .addColumn('status', sql`enum('active', 'paused', 'cancelled', 'expired')`, col => 
      col.notNull().defaultTo('active')
    )
    .addColumn('start_date', 'timestamp', col => 
      col.notNull()
    )
    .addColumn('end_date', 'timestamp', col => 
      col.notNull()
    )
    .addColumn('auto_renewal', 'boolean', col => 
      col.notNull().defaultTo(true)
    )
    .addColumn('payment_provider', 'varchar(20)', col => 
      col.notNull()
    )
    .addColumn('payment_provider_subscription_id', 'varchar(255)', col => 
      col.notNull()
    )
    .addColumn('cancellation_date', 'timestamp')
    .addColumn('created_at', 'timestamp', col => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', col => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  // Create indexes for user_subscriptions
  await db.schema
    .createIndex('idx_user_subscriptions_user_id')
    .on('user_subscriptions')
    .column('user_id')
    .execute()

  await db.schema
    .createIndex('idx_user_subscriptions_plan_id')
    .on('user_subscriptions')
    .column('plan_id')
    .execute()

  await db.schema
    .createIndex('idx_user_subscriptions_status')
    .on('user_subscriptions')
    .column('status')
    .execute()

  // Create subscription_charges table
  await db.schema
    .createTable('subscription_charges')
    .addColumn('id', 'bigint', col => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('user_subscription_id', 'bigint', col => 
      col.notNull().references('user_subscriptions.id')
    )
    .addColumn('amount', 'decimal(10, 2)', col => 
      col.notNull()
    )
    .addColumn('currency', 'varchar(3)', col => 
      col.notNull()
    )
    .addColumn('charge_date', 'timestamp', col => 
      col.notNull()
    )
    .addColumn('payment_provider', 'varchar(20)', col => 
      col.notNull()
    )
    .addColumn('payment_provider_transaction_id', 'varchar(255)', col => 
      col.notNull()
    )
    .addColumn('status', sql`enum('pending', 'success', 'failed')`, col => 
      col.notNull().defaultTo('pending')
    )
    .addColumn('created_at', 'timestamp', col => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', col => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  // Create indexes for subscription_charges
  await db.schema
    .createIndex('idx_subscription_charges_user_subscription_id')
    .on('subscription_charges')
    .column('user_subscription_id')
    .execute()

  await db.schema
    .createIndex('idx_subscription_charges_status')
    .on('subscription_charges')
    .column('status')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse order
  await db.schema.dropTable('subscription_charges').execute()
  await db.schema.dropTable('user_subscriptions').execute()
  await db.schema.dropTable('subscription_plan_features').execute()
  await db.schema.dropTable('subscription_plans').execute()
}