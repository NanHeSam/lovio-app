'use client';

import { useState } from 'react';
import { useDashboard } from '@/lib/hooks/useDashboard';
import FeedCard from './FeedCard';
import SleepCard from './SleepCard';
import DiaperCard from './DiaperCard';
import ActivityDetailModal from './ActivityDetailModal';
import { useToast } from '@/components/ui/toast';

interface DashboardCardsProps {
  childId: string;
}

export default function DashboardCards({ childId }: DashboardCardsProps) {
  const { data, loading, error, refetch } = useDashboard(childId);
  const { showToast } = useToast();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    activityType: 'sleep' | 'feed' | 'diaper' | null;
  }>({
    isOpen: false,
    activityType: null,
  });

  const openModal = (activityType: 'sleep' | 'feed' | 'diaper') => {
    setModalState({ isOpen: true, activityType });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, activityType: null });
  };

  const handleStopSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/activities/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          endTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop session');
      }

      // Refresh the dashboard data
      refetch();
      
      showToast("Activity session has been ended successfully.", 'success');
    } catch (error) {
      console.error('Error stopping session:', error);
      showToast("Failed to stop the session. Please try again.", 'error');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-50 rounded-xl border p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2 w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 mb-3">Error loading dashboard. Please try again.</p>
        <button 
          onClick={refetch} 
          className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { activeSessions, lastSleep, lastFeed, lastDiaper } = data;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <SleepCard 
          activeSession={activeSessions.find(s => s.type === 'sleep')}
          lastSleep={lastSleep}
          onClick={() => openModal('sleep')}
          onStopSession={handleStopSession}
        />
        <FeedCard 
          activeSession={activeSessions.find(s => s.type === 'feed')}
          lastFeed={lastFeed}
          onClick={() => openModal('feed')}
          onStopSession={handleStopSession}
        />
        <DiaperCard 
          lastDiaper={lastDiaper}
          onClick={() => openModal('diaper')}
        />
      </div>

      {/* Activity Detail Modal */}
      {modalState.activityType && (
        <ActivityDetailModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          activityType={modalState.activityType}
          activeSession={activeSessions.find(s => s.type === modalState.activityType)}
          lastActivity={
            modalState.activityType === 'sleep' ? lastSleep :
            modalState.activityType === 'feed' ? lastFeed :
            lastDiaper
          }
        />
      )}
    </>
  );
}
