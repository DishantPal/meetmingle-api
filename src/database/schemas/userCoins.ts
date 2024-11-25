import { mysqlTable, int, timestamp, index } from 'drizzle-orm/mysql-core';
import { users } from './users.js';

export const userCoins = mysqlTable('user_coins', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  balance: int('balance').default(0),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  userIdx: index('idx_user_coins_user').on(table.userId),
}));
