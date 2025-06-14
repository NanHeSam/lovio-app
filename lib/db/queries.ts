import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from './index';
import { users, children, userChildren } from './schema';
import type {
  User,
  NewUser,
  UserUpdate,
  Child,
  NewChild,
  ChildUpdate,
  UserChild,
  NewUserChild,
  UserWithChildren,
  ChildWithUsers,
} from './types';

// ============================================================================
// USER QUERIES
// ============================================================================

export async function createUser(userData: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(userData).returning();
  return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function updateUser(id: string, updates: UserUpdate): Promise<User | undefined> {
  const [user] = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

export async function getUserWithChildren(userId: string): Promise<UserWithChildren | undefined> {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      userChildren: {
        with: {
          child: true,
        },
        orderBy: [asc(userChildren.createdAt)],
      },
    },
  });
  return result;
}

// ============================================================================
// CHILD QUERIES
// ============================================================================

export async function createChild(childData: NewChild): Promise<Child> {
  const [child] = await db.insert(children).values(childData).returning();
  return child;
}

export async function getChildById(id: string): Promise<Child | undefined> {
  const [child] = await db.select().from(children).where(eq(children.id, id));
  return child;
}

export async function updateChild(id: string, updates: ChildUpdate): Promise<Child | undefined> {
  const [child] = await db
    .update(children)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(children.id, id))
    .returning();
  return child;
}

export async function deleteChild(id: string): Promise<void> {
  await db.delete(children).where(eq(children.id, id));
}

export async function getChildWithUsers(childId: string): Promise<ChildWithUsers | undefined> {
  const result = await db.query.children.findFirst({
    where: eq(children.id, childId),
    with: {
      userChildren: {
        with: {
          user: true,
        },
        orderBy: [asc(userChildren.createdAt)],
      },
    },
  });
  return result;
}

// ============================================================================
// USER-CHILD RELATIONSHIP QUERIES
// ============================================================================

export async function linkUserToChild(relationData: NewUserChild): Promise<UserChild> {
  const [relation] = await db.insert(userChildren).values(relationData).returning();
  return relation;
}

export async function unlinkUserFromChild(userId: string, childId: string): Promise<void> {
  await db
    .delete(userChildren)
    .where(and(eq(userChildren.userId, userId), eq(userChildren.childId, childId)));
}

export async function updateUserChildRelation(
  userId: string,
  childId: string,
  updates: Partial<Pick<UserChild, 'role' | 'permissions'>>
): Promise<UserChild | undefined> {
  const [relation] = await db
    .update(userChildren)
    .set(updates)
    .where(and(eq(userChildren.userId, userId), eq(userChildren.childId, childId)))
    .returning();
  return relation;
}

export async function getUserChildRelation(
  userId: string,
  childId: string
): Promise<UserChild | undefined> {
  const [relation] = await db
    .select()
    .from(userChildren)
    .where(and(eq(userChildren.userId, userId), eq(userChildren.childId, childId)));
  return relation;
}

export async function getChildrenForUser(userId: string): Promise<Child[]> {
  const result = await db
    .select({ child: children })
    .from(userChildren)
    .innerJoin(children, eq(userChildren.childId, children.id))
    .where(eq(userChildren.userId, userId))
    .orderBy(asc(children.birthDate));
  
  return result.map(row => row.child);
}

export async function getUsersForChild(childId: string): Promise<Array<User & { role: string; permissions: any }>> {
  const result = await db
    .select({
      user: users,
      role: userChildren.role,
      permissions: userChildren.permissions,
    })
    .from(userChildren)
    .innerJoin(users, eq(userChildren.userId, users.id))
    .where(eq(userChildren.childId, childId))
    .orderBy(asc(userChildren.createdAt));
  
  return result.map(row => ({
    ...row.user,
    role: row.role,
    permissions: row.permissions,
  }));
}