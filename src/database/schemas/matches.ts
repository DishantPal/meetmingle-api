import { mysqlTable, int, varchar, timestamp, json, index } from 'drizzle-orm/mysql-core';
import { users } from './users.js';

export const matches = mysqlTable('matches', {
  id: int('id').autoincrement().primaryKey(),
  userId1: int('user_id_1').references(() => users.id),
  userId2: int('user_id_2').references(() => users.id),
  matchType: varchar('match_type', { length: 50 }),
  status: varchar('status', { length: 50 }),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  usedPremiumFeatures: json('used_premium_features').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  user1StatusIdx: index('idx_matches_user1_status').on(table.userId1, table.status),
  user2StatusIdx: index('idx_matches_user2_status').on(table.userId2, table.status),
}));
