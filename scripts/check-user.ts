import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../lib/db/index';
import { users, children, userChildren } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkUser() {
  try {
    console.log('🔍 Checking users and children in database...\n');

    // Get all users
    const allUsers = await db.select().from(users);
    console.log('👥 Users in database:');
    allUsers.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`    Name: ${user.fullName}`);
      console.log(`    Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Get all children
    const allChildren = await db.select().from(children);
    console.log('👶 Children in database:');
    allChildren.forEach(child => {
      console.log(`  - ID: ${child.id}`);
      console.log(`    Name: ${child.name}`);
      console.log(`    Birth Date: ${child.birthDate}`);
      console.log('');
    });

    // Get all user-child relationships
    const relationships = await db
      .select({
        userId: userChildren.userId,
        childId: userChildren.childId,
        role: userChildren.role,
        userName: users.fullName,
        childName: children.name,
      })
      .from(userChildren)
      .leftJoin(users, eq(userChildren.userId, users.id))
      .leftJoin(children, eq(userChildren.childId, children.id));

    console.log('🔗 User-Child relationships:');
    relationships.forEach(rel => {
      console.log(`  - ${rel.userName} (${rel.userId}) → ${rel.childName} (${rel.childId}) [${rel.role}]`);
    });

    console.log('\n📝 To test the dashboard:');
    console.log('1. Make sure you\'re signed in with Clerk');
    console.log('2. Use one of the User IDs above as your Clerk user ID');
    console.log('3. Or update the TEST_USER_ID in seed-test-data.ts to match your Clerk ID');
    console.log('4. Visit /dashboard to see the activity cards');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkUser();