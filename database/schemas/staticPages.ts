import { mysqlTable, int, varchar, timestamp, boolean, text, index } from 'drizzle-orm/mysql-core';

export const staticPages = mysqlTable('static_pages', {
  id: int('id').autoincrement().primaryKey(),
  slug: varchar('slug', { length: 255 }).unique(),
  title: varchar('title', { length: 255 }),
  content: text('content'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  slugIdx: index('idx_static_pages_slug').on(table.slug, table.isActive),
}));
