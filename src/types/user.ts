import { DB, Users, UserProfiles } from "@/database/db.js";
import { Selectable } from "kysely";

export interface AuthUser extends Selectable<Users> {
    profile?: Partial<Selectable<UserProfiles>>;
}
