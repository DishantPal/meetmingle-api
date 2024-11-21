import { mysqlTable, int, varchar, timestamp, json, index } from 'drizzle-orm/mysql-core';

export const labelTranslations = mysqlTable('label_translations', {
  id: int('id').autoincrement().primaryKey(),
  group: varchar('group', { length: 100 }),
  key: varchar('key', { length: 255 }),
  value: json('value').$type<Record<string, string>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  groupKeyIdx: index('idx_label_translations_group_key').on(table.group, table.key),
}));
