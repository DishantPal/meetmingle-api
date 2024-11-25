import { mysqlTable, int, varchar, timestamp, boolean, text, index } from 'drizzle-orm/mysql-core';

export const adPlacements = mysqlTable('ad_placements', {
  id: int('id').autoincrement().primaryKey(),
  locationIdentifier: varchar('location_identifier', { length: 255 }).unique(),
  description: text('description'),
  isEnabled: boolean('is_enabled').default(true),
  adUnitId: varchar('ad_unit_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  locationIdx: index('idx_ad_placements_location').on(table.locationIdentifier, table.isEnabled),
}));
