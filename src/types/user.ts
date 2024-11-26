import { userProfiles } from "@/database/schemas/userProfiles.js";
import { users } from "@/database/schemas/users.js";
import { InferSelectModel } from "drizzle-orm";

export type DBUser = InferSelectModel<typeof users>;
export type DBUserProfile = InferSelectModel<typeof userProfiles>;

export interface AuthUser extends DBUser {
    profile?: DBUserProfile | null;
}
