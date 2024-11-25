import { mysqlTable, int, varchar, timestamp, text, json, index } from 'drizzle-orm/mysql-core';
import { users } from './users.js';
export const coinTransactions = mysqlTable('coin_transactions', {
    id: int('id').autoincrement().primaryKey(),
    userId: int('user_id').references(() => users.id),
    amount: int('amount'),
    transactionType: varchar('transaction_type', { length: 50 }),
    description: text('description'),
    metadata: json('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    userTimeIdx: index('idx_coin_transactions_user_time').on(table.userId, table.createdAt),
}));
