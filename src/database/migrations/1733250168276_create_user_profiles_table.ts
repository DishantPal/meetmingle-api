import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create user_profiles table
  await db.schema
    .createTable('user_profiles')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('user_id', 'bigint', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('profile_name', 'varchar(100)')
    .addColumn('profile_image_url', 'varchar(500)')
    .addColumn('bio', 'text')
    .addColumn('dob', 'date')
    .addColumn('gender', 'varchar(20)')
    .addColumn('country', 'varchar(100)')
    .addColumn('state', 'varchar(100)')
    .addColumn('preferred_language', 'varchar(50)')
    .addColumn('relationship_status', 'varchar(50)')
    .addColumn('interests', 'json')
    .addColumn('hashtags', 'json')
    .addColumn('looking_for', 'json')
    .addColumn('personality_traits', 'json')
    .addColumn('pet_info', 'text')
    .addColumn('is_drinking', 'boolean', (col) =>
      col.defaultTo(false)
    )
    .addColumn('is_smoking', 'boolean', (col) =>
      col.defaultTo(false)
    )
    .addColumn('is_fitness_enthusiast', 'boolean', (col) =>
      col.defaultTo(false)
    )
    .addColumn('profile_completion_percentage', 'integer', (col) =>
      col.defaultTo(0)
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull()
    )
    .execute()

  // Create index on user_id
  await db.schema
    .createIndex('idx_user_profiles_user_id')
    .on('user_profiles')
    .columns(['user_id'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_profiles').execute()
}