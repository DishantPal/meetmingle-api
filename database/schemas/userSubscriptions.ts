import { mysqlTable, int, varchar, timestamp, index } from 'drizzle-orm/mysql-core';
import { users } from './users.ts';
import { subscriptionPlans } from './subscriptionPlans.ts';

export const userSubscriptions = mysqlTable('user_subscriptions', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  planId: int('plan_id').references(() => subscriptionPlans.id),
  status: varchar('status', { length: 50 }),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  nextBillingDate: timestamp('next_billing_date'),
  paymentReference: varchar('payment_reference', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  userStatusIdx: index('idx_user_subscriptions_status').on(table.userId, table.status),
}));
