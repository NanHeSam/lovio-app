import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, children, userChildren, activities, aiInteractions } from './schema';

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

// Activity types
export type Activity = InferSelectModel<typeof activities>;
export type NewActivity = InferInsertModel<typeof activities>;
export type ActivityUpdate = Partial<Omit<NewActivity, 'id' | 'createdAt'>>;

// AI Interaction types
export type AiInteraction = InferSelectModel<typeof aiInteractions>;
export type NewAiInteraction = InferInsertModel<typeof aiInteractions>;

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
  notifications?: boolean;
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
  volume?: 'little' | 'medium' | 'large';
  hasRash?: boolean;
  pooColor?: 'yellow' | 'brown' | 'green' | 'black' | 'other';
  pooTexture?: 'liquid' | 'soft' | 'formed' | 'hard';
}

export type ActivityDetails = SleepDetails | FeedDetails | DiaperDetails | null;

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

export type ActivityWithChild = Activity & {
  child: Child;
  createdByUser: User;
};

// MCP Function Results
export interface ActiveSession {
  id: string;
  type: ActivityType;
  childId: string;
  childName: string;
  startTime: Date;
  durationMinutes: number;
}

export interface DailySummary {
  date: string;
  childId: string;
  childName: string;
  totalSleep: number; // minutes
  sleepSessions: number;
  totalFeed: number; // minutes or count
  feedSessions: number;
  diaperChanges: number;
}

export interface RecentActivity {
  id: string;
  type: ActivityType;
  childName: string;
  startTime: Date;
  endTime?: Date | null;
  details: ActivityDetails | null;
  ago: string; // "2 hours ago"
}