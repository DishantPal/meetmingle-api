import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('rewards')
        .addColumn('button_label', 'varchar(255)', (col) => col.defaultTo("Claim Now"))
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('rewards')
        .dropColumn('button_label')
        .execute()
}