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
export type UserRole = 'mom' | 'dad' | 'nanny' | 'extended-family' | 'other';
export type ActivityType = 'sleep' | 'feed' | 'diaper';

export interface UserPermissions {
  read: boolean;
  write: boolean;
  admin: boolean;
}

export interface UserPreferences {
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
  headCircumference?: Array<{
    date: string;
    value: number;
    unit: 'cm' | 'in';
  }>;
}

// Activity Details Types
export interface SleepDetails {
  type: 'sleep';
}

export interface NursingDetails {
  type: 'nursing';
  leftDuration?: number; // minutes
  rightDuration?: number; // minutes
  totalDuration?: number; // minutes
}

export interface BottleDetails {
  type: 'bottle';
  volume: number; // ml or oz
  unit: 'ml' | 'oz';
}

export type FeedDetails = NursingDetails | BottleDetails;

export interface DiaperDetails {
  type: 'diaper';
  contents: 'pee' | 'poo' | 'both';
  volume: 'little' | 'medium' | 'large';
  hasRash?: boolean;
  pooColor?: 'yellow' | 'brown' | 'green' | 'black' | 'other';
  pooTexture?: 'liquid' | 'soft' | 'formed' | 'hard';
}

export type ActivityDetails = SleepDetails | FeedDetails | DiaperDetails;

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