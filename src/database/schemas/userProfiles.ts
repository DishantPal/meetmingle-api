import { mysqlTable, int, varchar, timestamp, boolean, text, json, index } from 'drizzle-orm/mysql-core';
import { users } from './users.js';
import { relations } from 'drizzle-orm';

export const userProfiles = mysqlTable('user_profiles', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  profileName: varchar('profile_name', { length: 255 }),
  profileImageUrl: varchar('profile_image_url', { length: 255 }),
  bio: text('bio'),
  dob: timestamp('dob'),
  gender: varchar('gender', { length: 20 }),
  country: varchar('country', { length: 100 }),
  state: varchar('state', { length: 100 }),
  preferredLanguage: varchar('preferred_language', { length: 50 }),
  relationshipStatus: varchar('relationship_status', { length: 50 }),
  interests: json('interests').$type<string[]>(),
  hashtags: json('hashtags').$type<string[]>(),
  lookingFor: json('looking_for').$type<string[]>(),
  personalityTraits: json('personality_traits').$type<string[]>(),
  petInfo: text('pet_info'),
  isDrinking: boolean('is_drinking').default(false),
  isSmoking: boolean('is_smoking').default(false),
  isFitnessEnthusiast: boolean('is_fitness_enthusiast').default(false),
  profileCompletionPercentage: int('profile_completion_percentage').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  userIdIdx: index('idx_user_profiles_user_id').on(table.userId),
}));

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
}));