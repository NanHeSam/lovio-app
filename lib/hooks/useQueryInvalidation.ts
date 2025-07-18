'use client';

import { useQueryClient } from '@tanstack/react-query';

export function useQueryInvalidation() {
  const queryClient = useQueryClient();

  const invalidateDashboard = (childId: string) => {
    // Invalidate dashboard data for the specific child
    queryClient.invalidateQueries({
      queryKey: ['dashboard', childId],
    });
  };

  const invalidateActivities = (childId: string) => {
    // Invalidate activities data for the specific child
    queryClient.invalidateQueries({
      queryKey: ['activities', childId],
    });
  };

  const invalidateAllChildData = (childId: string) => {
    // Invalidate all data related to a specific child
    queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return queryKey.includes(childId);
      },
    });
  };

  const refetchDashboard = (childId: string) => {
    // Force refetch dashboard data immediately
    return queryClient.refetchQueries({
      queryKey: ['dashboard', childId],
    });
  };

  const setDashboardData = (childId: string, data: any) => {
    // Manually update dashboard cache with new data
    queryClient.setQueryData(['dashboard', childId], data);
  };

  return {
    invalidateDashboard,
    invalidateActivities, 
    invalidateAllChildData,
    refetchDashboard,
    setDashboardData,
  };
}