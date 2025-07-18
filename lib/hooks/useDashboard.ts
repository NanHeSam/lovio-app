'use client';

import { useQuery } from '@tanstack/react-query';
import { ActiveSession, RecentActivity } from '@/lib/db/types';

interface DashboardData {
  activeSessions: ActiveSession[];
  lastSleep?: RecentActivity;
  lastFeed?: RecentActivity;
  lastDiaper?: RecentActivity;
}

interface UseDashboardResult {
  data: DashboardData | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Fetch function for dashboard data
const fetchDashboardData = async (childId: string): Promise<DashboardData> => {
  const response = await fetch(`/api/dashboard/${childId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch dashboard data');
  }

  const dashboardData = await response.json();
  
  // Convert date strings back to Date objects
  const processedData: DashboardData = {
    activeSessions: dashboardData.activeSessions.map((session: any) => ({
      ...session,
      startTime: new Date(session.startTime),
    })),
    lastSleep: dashboardData.lastSleep ? {
      ...dashboardData.lastSleep,
      startTime: new Date(dashboardData.lastSleep.startTime),
      endTime: dashboardData.lastSleep.endTime ? new Date(dashboardData.lastSleep.endTime) : null,
    } : undefined,
    lastFeed: dashboardData.lastFeed ? {
      ...dashboardData.lastFeed,
      startTime: new Date(dashboardData.lastFeed.startTime),
      endTime: dashboardData.lastFeed.endTime ? new Date(dashboardData.lastFeed.endTime) : null,
    } : undefined,
    lastDiaper: dashboardData.lastDiaper ? {
      ...dashboardData.lastDiaper,
      startTime: new Date(dashboardData.lastDiaper.startTime),
      endTime: dashboardData.lastDiaper.endTime ? new Date(dashboardData.lastDiaper.endTime) : null,
    } : undefined,
  };

  return processedData;
};

export function useDashboard(childId: string): UseDashboardResult {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', childId],
    queryFn: () => fetchDashboardData(childId),
    enabled: !!childId,
    // Refresh every 30 seconds if there are active sessions
    refetchInterval: (query) => {
      return query.state.data?.activeSessions?.length ? 30000 : false;
    },
    // Keep data fresh for 10 seconds
    staleTime: 10 * 1000,
    // Refetch on window focus for real-time updates
    refetchOnWindowFocus: true,
    // Refetch when reconnecting
    refetchOnReconnect: true,
  });

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    refetch: () => {
      refetch();
    },
  };
}