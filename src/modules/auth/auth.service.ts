import { db } from "@/database/connection.js";
import { userProfiles } from "@/database/schemas/userProfiles.js";
import { users } from "@/database/schemas/users.js";

export const findUserWithProfileByEmail = async (email: string) => {

    const user = await db.select().from(users)

    if(!user) return null;

    return user;
};


export const createUserWithProfile = async (email: string) => {
    const user = await db.insert(users).values({ email });
    const profile = await db.insert(userProfiles).values({ userId: user[0].id });
    return { user, profile };
};