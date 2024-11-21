import { mysqlTable, int, varchar, timestamp, json, index } from 'drizzle-orm/mysql-core';

export const appSettings = mysqlTable('app_settings', {
  id: int('id').autoincrement().primaryKey(),
  key: varchar('key', { length: 255 }).unique(),
  value: json('value'),
  group: varchar('group', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  groupKeyIdx: index('idx_app_settings_group').on(table.group, table.key),
}));
