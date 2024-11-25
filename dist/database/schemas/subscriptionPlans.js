import { mysqlTable, int, varchar, timestamp, boolean, text, json } from 'drizzle-orm/mysql-core';
export const subscriptionPlans = mysqlTable('subscription_plans', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }),
    description: text('description'),
    price: int('price'),
    currency: varchar('currency', { length: 3 }),
    durationDays: int('duration_days'),
    features: json('features').$type(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at'),
});
