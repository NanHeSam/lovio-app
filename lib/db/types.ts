import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, children, userChildren } from './schema';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserUpdate = Partial<Omit<NewUser, 'id' | 'createdAt'>>;

// Child types
export type Child = InferSelectModel<typeof children>;
export type NewChild = InferInsertModel<typeof children>;
export type ChildUpdate = Partial<Omit<NewChild, 'id' | 'createdAt'>>;

// UserChild types
export type UserChild = InferSelectModel<typeof userChildren>;
export type NewUserChild = InferInsertModel<typeof userChildren>;
export type UserChildUpdate = Partial<Omit<NewUserChild, 'id' | 'createdAt'>>;

// ============================================================================
// ENUM TYPES
// ============================================================================

export type Gender = 'male' | 'female';
export type UserRole = 'parent' | 'guardian' | 'caregiver' | 'family';

export interface UserPermissions {
  read: boolean;
  write: boolean;
  admin: boolean;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    reminders?: boolean;
  };
  privacy?: {
    shareData?: boolean;
    analytics?: boolean;
  };
}

export interface ChildMetadata {
  height?: Array<{
    date: string;
    value: number;
    unit: 'cm' | 'in';
  }>;
  weight?: Array<{
    date: string;
    value: number;
    unit: 'kg' | 'lbs';
  }>;
  medical?: {
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
    doctor?: {
      name: string;
      phone?: string;
      email?: string;
    };
  };
  milestones?: Array<{
    date: string;
    milestone: string;
    notes?: string;
  }>;
}

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

export type UserWithChildren = User & {
  userChildren: Array<UserChild & {
    child: Child;
  }>;
};

export type ChildWithUsers = Child & {
  userChildren: Array<UserChild & {
    user: User;
  }>;
};