import { mysqlTable, int, varchar, timestamp, text, index } from 'drizzle-orm/mysql-core';
import { matches } from './matches.js';
import { users } from './users.js';

export const matchReports = mysqlTable('match_reports', {
  id: int('id').autoincrement().primaryKey(),
  matchId: int('match_id').references(() => matches.id),
  reporterId: int('reporter_id').references(() => users.id),
  reportedUserId: int('reported_user_id').references(() => users.id),
  reason: varchar('reason', { length: 100 }),
  customMessage: text('custom_message'),
  status: varchar('status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
}, (table) => ({
  reporterIdx: index('idx_match_reports_reporter').on(table.reporterId, table.status),
  reportedIdx: index('idx_match_reports_reported').on(table.reportedUserId, table.status),
}));
