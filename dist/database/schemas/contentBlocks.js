import { mysqlTable, int, varchar, timestamp, boolean, json, index } from 'drizzle-orm/mysql-core';
export const contentBlocks = mysqlTable('content_blocks', {
    id: int('id').autoincrement().primaryKey(),
    identifier: varchar('identifier', { length: 255 }).unique(),
    title: varchar('title', { length: 255 }),
    content: json('content'),
    type: varchar('type', { length: 50 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at'),
}, (table) => ({
    identifierIdx: index('idx_content_blocks_identifier').on(table.identifier, table.isActive),
}));
