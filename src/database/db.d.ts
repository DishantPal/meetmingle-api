/**
 * This file was generated by kysely-codegen.
 * Please do not edit it manually.
 */

import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Json = ColumnType<JsonValue, string, string>;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [x: string]: JsonValue | undefined;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export interface AppSettings {
  created_at: Generated<Date>;
  group: string;
  id: Generated<number>;
  key: string;
  updated_at: Date;
  value: string;
}

export interface ContentBlocks {
  content: Json;
  created_at: Generated<Date>;
  id: Generated<number>;
  is_active: Generated<number>;
  purpose: string;
  title: string;
  type: string;
  updated_at: Date;
}

export interface Countries {
  code: string;
  created_at: Generated<Date>;
  id: Generated<number>;
  is_active: Generated<number>;
  name: string;
  region: string;
  updated_at: Generated<Date>;
}

export interface Languages {
  code: string;
  created_at: Generated<Date>;
  id: Generated<number>;
  is_active: Generated<number>;
  name: string;
  native_name: string;
  updated_at: Generated<Date>;
}

export interface States {
  country_code: string;
  created_at: Generated<Date>;
  id: Generated<number>;
  is_active: Generated<number>;
  name: string;
  state_code: string;
  updated_at: Generated<Date>;
}

export interface StaticPages {
  content: string;
  created_at: Generated<Date>;
  id: Generated<number>;
  is_active: Generated<number>;
  slug: string;
  title: string;
  updated_at: Date;
}

export interface UserProfiles {
  bio: string | null;
  country: string | null;
  created_at: Generated<Date>;
  dob: Date | null;
  gender: string | null;
  hashtags: Json | null;
  id: Generated<number>;
  interests: Json | null;
  is_drinking: Generated<number | null>;
  is_fitness_enthusiast: Generated<number | null>;
  is_smoking: Generated<number | null>;
  looking_for: Json | null;
  personality_traits: Json | null;
  pet_info: string | null;
  preferred_language: string | null;
  profile_completion_percentage: Generated<number | null>;
  profile_image_url: string | null;
  profile_name: string | null;
  relationship_status: string | null;
  state: string | null;
  updated_at: Generated<Date>;
  user_id: number;
}

export interface Users {
  ban_reason: string | null;
  created_at: Generated<Date>;
  deleted_at: Date | null;
  email: string | null;
  email_verified_at: Date | null;
  id: Generated<number>;
  is_banned: Generated<number>;
  password_hash: string | null;
  provider_id: string | null;
  provider_type: string | null;
  updated_at: Generated<Date>;
}

export interface DB {
  app_settings: AppSettings;
  content_blocks: ContentBlocks;
  countries: Countries;
  languages: Languages;
  states: States;
  static_pages: StaticPages;
  user_profiles: UserProfiles;
  users: Users;
}
