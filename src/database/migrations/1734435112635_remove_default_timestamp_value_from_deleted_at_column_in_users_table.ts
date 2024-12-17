import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('users')
        .alterColumn('deleted_at', (col) => col.dropDefault())
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('users')
        .alterColumn('deleted_at', (col) => col.setDefault(null))
        .execute()
}