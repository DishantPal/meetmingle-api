import { mysqlTable, int, varchar, timestamp, index } from 'drizzle-orm/mysql-core';
export const banners = mysqlTable('banners', {
    id: int('id').autoincrement().primaryKey(),
    title: varchar('title', { length: 255 }),
    imageUrl: varchar('image_url', { length: 255 }),
    link: varchar('link', { length: 255 }),
    linkType: varchar('link_type', { length: 50 }),
    location: varchar('location', { length: 50 }),
    sortOrder: int('sort_order').default(0),
    status: varchar('status', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at'),
}, (table) => ({
    locationStatusIdx: index('idx_banners_location_status').on(table.location, table.status, table.sortOrder),
}));
