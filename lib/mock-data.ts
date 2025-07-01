import { Activity, Child, User, ActivityType, FeedDetails, SleepDetails, DiaperDetails, ActiveSession, RecentActivity } from './db/types';

// Mock child data
export const mockChild: Child = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Emma',
  birthDate: '2024-01-15',
  gender: 'female',
  avatarUrl: null,
  metadata: {},
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
};

// Mock user data
export const mockUser: User = {
  id: 'user_123',
  fullName: 'Sarah Johnson',
  timezone: 'America/New_York',
  avatarUrl: null,
  preferences: {},
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  lastActiveAt: new Date('2024-07-01T10:00:00Z'),
};

// Helper function to create dates relative to now
const now = new Date();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000);

// Mock activities with different scenarios
export const mockActivities: Activity[] = [
  // Recent completed sleep
  {
    id: '1',
    childId: mockChild.id,
    createdBy: mockUser.id,
    type: 'sleep' as ActivityType,
    startTime: hoursAgo(3),
    endTime: hoursAgo(1),
    details: { type: 'sleep' } as SleepDetails,
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(1),
  },
  // Recent bottle feed
  {
    id: '2',
    childId: mockChild.id,
    createdBy: mockUser.id,
    type: 'feed' as ActivityType,
    startTime: minutesAgo(45),
    endTime: minutesAgo(30),
    details: { 
      type: 'bottle',
      volume: 120,
      unit: 'ml'
    } as FeedDetails,
    createdAt: minutesAgo(45),
    updatedAt: minutesAgo(30),
  },
  // Recent diaper change
  {
    id: '3',
    childId: mockChild.id,
    createdBy: mockUser.id,
    type: 'diaper' as ActivityType,
    startTime: minutesAgo(20),
    endTime: minutesAgo(20),
    details: {
      type: 'diaper',
      contents: 'both',
      volume: 'medium',
      hasRash: false,
      pooColor: 'brown',
      pooTexture: 'soft'
    } as DiaperDetails,
    createdAt: minutesAgo(20),
    updatedAt: minutesAgo(20),
  },
];

// Mock for ongoing sleep session
export const mockActiveSleepSession: Activity = {
  id: '4',
  childId: mockChild.id,
  createdBy: mockUser.id,
  type: 'sleep' as ActivityType,
  startTime: minutesAgo(45),
  endTime: null, // Ongoing session
  details: { type: 'sleep' } as SleepDetails,
  createdAt: minutesAgo(45),
  updatedAt: minutesAgo(45),
};

// Mock for ongoing feed session (nursing)
export const mockActiveFeedSession: Activity = {
  id: '5',
  childId: mockChild.id,
  createdBy: mockUser.id,
  type: 'feed' as ActivityType,
  startTime: minutesAgo(7),
  endTime: null, // Ongoing session
  details: {
    type: 'nursing',
    leftDuration: 10,
    rightDuration: 0,
    totalDuration: 10
  } as FeedDetails,
  createdAt: minutesAgo(7),
  updatedAt: minutesAgo(5),
};

// Helper function to get duration in minutes
export const getDurationMinutes = (startTime: Date, endTime?: Date | null): number => {
  const end = endTime || new Date();
  return Math.floor((end.getTime() - startTime.getTime()) / (1000 * 60));
};

// Helper function to format time ago
export const formatTimeAgo = (date: Date): string => {
  const minutes = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Mock dashboard data scenarios
export const mockDashboardData = {
  // Scenario 1: No active sessions, show last activities
  noActiveSessions: {
    activeSessions: [] as ActiveSession[],
    lastSleep: mockActivities[0],
    lastFeed: mockActivities[1],
    lastDiaper: mockActivities[2],
  },
  
  // Scenario 2: Active sleep session
  activeSleepSession: {
    activeSessions: [{
      id: mockActiveSleepSession.id,
      type: 'sleep' as ActivityType,
      childId: mockChild.id,
      childName: mockChild.name,
      startTime: mockActiveSleepSession.startTime,
      durationMinutes: getDurationMinutes(mockActiveSleepSession.startTime),
    }] as ActiveSession[],
    lastFeed: mockActivities[1],
    lastDiaper: mockActivities[2],
  },
  
  // Scenario 3: Active feed session
  activeFeedSession: {
    activeSessions: [{
      id: mockActiveFeedSession.id,
      type: 'feed' as ActivityType,
      childId: mockChild.id,
      childName: mockChild.name,
      startTime: mockActiveFeedSession.startTime,
      durationMinutes: getDurationMinutes(mockActiveFeedSession.startTime),
    }] as ActiveSession[],
    lastSleep: mockActivities[0],
    lastDiaper: mockActivities[2],
  },
};

// Default export for easy importing
export default mockDashboardData.noActiveSessions;
