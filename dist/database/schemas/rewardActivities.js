import { mysqlTable, int, varchar, timestamp, boolean, text, json, index } from 'drizzle-orm/mysql-core';
export const rewardActivities = mysqlTable('reward_activities', {
    id: int('id').autoincrement().primaryKey(),
    code: varchar('code', { length: 100 }).unique(),
    name: varchar('name', { length: 255 }),
    description: text('description'),
    coinsReward: int('coins_reward'),
    isOneTime: boolean('is_one_time').default(true),
    isActive: boolean('is_active').default(true),
    metadata: json('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at'),
}, (table) => ({
    codeIdx: index('idx_reward_activities_code').on(table.code),
}));
