import { mysqlTable, int, varchar, timestamp, index } from 'drizzle-orm/mysql-core';
import { users } from './users.ts';
import { rewardActivities } from './rewardActivities.ts';

export const userRewards = mysqlTable('user_rewards', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  activityId: int('activity_id').references(() => rewardActivities.id),
  status: varchar('status', { length: 50 }),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userActivityIdx: index('idx_user_rewards_user_activity').on(table.userId, table.activityId),
}));
