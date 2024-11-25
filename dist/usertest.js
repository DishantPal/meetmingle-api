import { db } from './database/connection.js';
import { users } from './database/schemas/index.js';
import { eq } from 'drizzle-orm';
async function getAllUsers() {
    const allUsers = await db.select().from(users);
    console.log('All users:', allUsers);
    return allUsers;
}
async function createUser(email, providerType, passwordHash) {
    const newUser = await db.insert(users).values({
        email,
        providerType,
        passwordHash,
    });
    console.log('Created user:', newUser);
    return newUser;
}
async function getUserByEmail(email) {
    const user = await db.select().from(users).where(eq(users.email, email));
    console.log('Found user:', user);
    return user;
}
async function updateUserByEmail(email, data) {
    const updated = await db.update(users)
        .set({ providerType: data.providerType })
        .where(eq(users.email, email));
    console.log('Updated user:', updated);
    return updated;
}
async function deleteUserByEmail(email) {
    const deleted = await db.delete(users).where(eq(users.email, email));
    console.log('Deleted user:', deleted);
    return deleted;
}
export async function testCrud() {
    try {
        console.log('Starting CRUD operations...');
        const newUser = await createUser('mark@mail.com', 'google', 'test123');
        const newUser1 = await createUser('elie@mail.com', 'google', 'test123');
        await getAllUsers();
        await getUserByEmail('mark@mail.com');
        await updateUserByEmail('elie@mail.com', { providerType: 'email' });
        await deleteUserByEmail('mark@mail.com');
        console.log('CRUD operations completed!');
    }
    catch (error) {
        console.error('Error:', error);
    }
}
