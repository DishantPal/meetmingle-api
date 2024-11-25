import { db } from './database/connection.js';
import { users } from './database/schemas/index.js';
import { eq } from 'drizzle-orm';

// Get all users
async function getAllUsers() {
  const allUsers = await db.select().from(users);
  console.log('All users:', allUsers);
  return allUsers;
}

// Create a user
async function createUser(email: string, providerType: string, passwordHash: string) {
  const newUser = await db.insert(users).values({
    email,
    providerType,
    passwordHash,
  });
  console.log('Created user:', newUser);
  return newUser;
}

// Get user by id
async function getUserByEmail(email: string) {
  const user = await db.select().from(users).where(eq(users.email, email));
  console.log('Found user:', user);
  return user;
}

// Update user
async function updateUserByEmail(email: string, data: any) {
  const updated = await db.update(users)
    .set({ providerType: data.providerType })
    .where(eq(users.email, email));
  console.log('Updated user:', updated);
  return updated;
}

// Delete user
async function deleteUserByEmail(email: string) {
  const deleted = await db.delete(users).where(eq(users.email, email));
  console.log('Deleted user:', deleted);
  return deleted;
}

// Test all operations
export async function testCrud() {
  try {
    console.log('Starting CRUD operations...');
    
    // Create
    const newUser = await createUser('mark@mail.com','google','test123');
    const newUser1 = await createUser('elie@mail.com','google','test123');
    
    // Read all
    await getAllUsers();
    
    // Read one
    await getUserByEmail('mark@mail.com');
    
    // Update
    await updateUserByEmail('elie@mail.com', {providerType: 'email'});
    
    // Delete
    await deleteUserByEmail('mark@mail.com');
    
    console.log('CRUD operations completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

// // Run the test
// testCrud();