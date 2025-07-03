import { randomBytes, createHash } from 'crypto';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a secure API key with the format: lv_live_<32-char-hex>
 */
export function generateApiKey(): string {
  const randomString = randomBytes(16).toString('hex');
  return `lv_live_${randomString}`;
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  const apiKeyRegex = /^lv_live_[a-f0-9]{32}$/;
  return apiKeyRegex.test(apiKey);
}

/**
 * Generate and store API key for a user
 */
export async function generateUserApiKey(userId: string): Promise<string> {
  const apiKey = generateApiKey();
  const hashedApiKey = hashApiKey(apiKey);
  
  // Check if user already has an API key
  const existingUser = await db
    .select({ apiKey: users.apiKey })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (existingUser[0]?.apiKey) {
    // User already has an API key, don't overwrite it
    throw new Error(`User ${userId} already has an API key`);
  }
  
  // Update user with new API key
  await db
    .update(users)
    .set({
      apiKey: hashedApiKey,
      apiKeyCreatedAt: new Date(),
      apiKeyActive: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  
  return apiKey; // Return the unhashed key for the user to store
}

/**
 * Validate API key and return user if valid
 */
export async function validateApiKey(apiKey: string): Promise<{ id: string; fullName: string } | null> {
  if (!isValidApiKeyFormat(apiKey)) {
    return null;
  }
  
  const hashedApiKey = hashApiKey(apiKey);
  
  const user = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      apiKeyActive: users.apiKeyActive,
    })
    .from(users)
    .where(eq(users.apiKey, hashedApiKey))
    .limit(1);
  
  if (!user[0] || !user[0].apiKeyActive) {
    return null;
  }
  
  // Update last used timestamp
  await db
    .update(users)
    .set({
      apiKeyLastUsedAt: new Date(),
      lastActiveAt: new Date(),
    })
    .where(eq(users.id, user[0].id));
  
  return {
    id: user[0].id,
    fullName: user[0].fullName,
  };
}

/**
 * Revoke API key for a user
 */
export async function revokeApiKey(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      apiKeyActive: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Regenerate API key for a user
 */
export async function regenerateApiKey(userId: string): Promise<string> {
  // First revoke the old key
  await revokeApiKey(userId);
  
  // Generate a new one
  return await generateUserApiKey(userId);
}

/**
 * Get API key info for a user (without revealing the actual key)
 */
export async function getApiKeyInfo(userId: string) {
  const user = await db
    .select({
      apiKeyCreatedAt: users.apiKeyCreatedAt,
      apiKeyLastUsedAt: users.apiKeyLastUsedAt,
      apiKeyActive: users.apiKeyActive,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user[0]) {
    return null;
  }
  
  return {
    hasApiKey: !!user[0].apiKeyCreatedAt,
    createdAt: user[0].apiKeyCreatedAt,
    lastUsedAt: user[0].apiKeyLastUsedAt,
    isActive: user[0].apiKeyActive,
  };
}
