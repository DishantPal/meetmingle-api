import { relations } from 'drizzle-orm';
import { mysqlTable, int, varchar, timestamp, boolean, text, primaryKey, index } from 'drizzle-orm/mysql-core';
import { userProfiles } from './userProfiles.js';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  providerType: varchar('provider_type', { length: 50 }),
  providerId: varchar('provider_id', { length: 255 }),
  providerToken: text('provider_token'),
  emailVerifiedAt: timestamp('email_verified_at'),
  passwordHash: varchar('password_hash', { length: 255 }),
  isBanned: boolean('is_banned').default(false),
  banReason: text('ban_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
  deletedAt: timestamp('deleted_at'),
}, (table) => {
  return {
    emailIdx: index('idx_users_email').on(table.email, table.deletedAt),
    providerIdx: index('idx_users_provider').on(table.providerType, table.providerId, table.deletedAt),
  };
});

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
}));