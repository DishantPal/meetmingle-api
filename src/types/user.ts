import { DB, Users, UserProfiles } from "@/database/db.js";

export interface AuthUser extends Users {
    profile?: UserProfiles;
}
