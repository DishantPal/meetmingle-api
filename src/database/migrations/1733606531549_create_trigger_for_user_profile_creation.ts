import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>) {
  // Create the trigger
  await sql`
    CREATE TRIGGER after_user_insert
    AFTER INSERT ON users
    FOR EACH ROW
    BEGIN
        INSERT INTO user_profiles (user_id, profile_name)
        VALUES (NEW.id, SUBSTRING_INDEX(NEW.email, '@', 1));
    END;
  `.execute(db)
}

export async function down(db: Kysely<any>) {
  // Drop trigger
  await sql`DROP TRIGGER IF EXISTS after_user_insert`.execute(db)
}