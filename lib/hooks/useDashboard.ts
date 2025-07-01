'use client';

import { useState, useEffect } from 'react';
import { ActiveSession, RecentActivity } from '@/lib/db/types';

interface DashboardData {
  activeSessions: ActiveSession[];
  lastSleep?: RecentActivity;
  lastFeed?: RecentActivity;
  lastDiaper?: RecentActivity;
}

interface UseDashboardResult {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(childId: string): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

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

      setData(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (childId) {
      fetchDashboard();
    }
  }, [childId]);

  // Auto-refresh data every 30 seconds if there are active sessions
  useEffect(() => {
    if (data?.activeSessions.length) {
      const interval = setInterval(fetchDashboard, 30000);
      return () => clearInterval(interval);
    }
  }, [data?.activeSessions.length]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
  };
}