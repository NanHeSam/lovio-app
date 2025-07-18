'use client';

import { useState } from 'react';
import { useDashboard } from '@/lib/hooks/useDashboard';
import FeedCard from './FeedCard';
import SleepCard from './SleepCard';
import DiaperCard from './DiaperCard';
import ActivityDetailModal from './ActivityDetailModal';
import EditActivityModal from '../activities/EditActivityModal';
import { useToast } from '@/components/ui/toast';
import type { RecentActivity, ActivityType } from '@/lib/db/types';

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

  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    activity: {
      id: string;
      type: ActivityType;
      startTime: string;
      endTime: string | null;
      details: any;
      createdAt: string;
    } | null;
  }>({
    isOpen: false,
    activity: null,
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    activity: RecentActivity | null;
  }>({
    show: false,
    activity: null,
  });

  const openModal = (activityType: 'sleep' | 'feed' | 'diaper') => {
    setModalState({ isOpen: true, activityType });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, activityType: null });
  };

  const handleEditActivity = (recentActivity: RecentActivity) => {
    // Convert RecentActivity to Activity by adding createdAt
    const activity = {
      ...recentActivity,
      startTime: recentActivity.startTime.toISOString(),
      endTime: recentActivity.endTime ? recentActivity.endTime.toISOString() : null,
      createdAt: new Date().toISOString(), // Use current time as fallback for createdAt
    };
    setEditModal({ isOpen: true, activity });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, activity: null });
  };

  const handleDeleteActivity = (activity: RecentActivity) => {
    setDeleteConfirmation({ show: true, activity });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.activity) return;
    
    try {
      const response = await fetch(`/api/activities/${childId}?activityId=${deleteConfirmation.activity.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete activity');
      }

      showToast('Activity deleted successfully', 'success');
      refetch(); // Refresh dashboard data
      setDeleteConfirmation({ show: false, activity: null });
    } catch (error) {
      console.error('Error deleting activity:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete activity', 'error');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, activity: null });
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
          onEditActivity={handleEditActivity}
          onDeleteActivity={handleDeleteActivity}
        />
        <FeedCard 
          activeSession={activeSessions.find(s => s.type === 'feed')}
          lastFeed={lastFeed}
          onClick={() => openModal('feed')}
          onStopSession={handleStopSession}
          onEditActivity={handleEditActivity}
          onDeleteActivity={handleDeleteActivity}
        />
        <DiaperCard 
          lastDiaper={lastDiaper}
          onClick={() => openModal('diaper')}
          onEditActivity={handleEditActivity}
          onDeleteActivity={handleDeleteActivity}
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

      {/* Edit Activity Modal */}
      {editModal.activity && (
        <EditActivityModal
          isOpen={editModal.isOpen}
          onClose={closeEditModal}
          activity={editModal.activity}
          childId={childId}
          onSave={() => {
            refetch();
            closeEditModal();
            showToast('Activity updated successfully', 'success');
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && deleteConfirmation.activity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Delete Activity
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {deleteConfirmation.activity.type} activity? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
