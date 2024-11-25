import { mysqlTable, int, varchar, timestamp, boolean } from 'drizzle-orm/mysql-core';
export const coinPackages = mysqlTable('coin_packages', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }),
    coinsAmount: int('coins_amount'),
    price: int('price'),
    currency: varchar('currency', { length: 3 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at'),
});
