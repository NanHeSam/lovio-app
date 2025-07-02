'use client';

import { useState } from 'react';
import DashboardCards from './DashboardCards';
import PersistentAIInput from './PersistentAIInput';
import ClarificationModal from './ClarificationModal';
import { useToast } from '@/components/ui/toast';

interface DashboardWrapperProps {
  childId: string;
  userId: string;
}

export default function DashboardWrapper({ childId, userId }: DashboardWrapperProps) {
  const [clarificationModal, setClarificationModal] = useState<{
    isOpen: boolean;
    message: string;
    context: any;
  }>({
    isOpen: false,
    message: '',
    context: null,
  });

  const { showToast } = useToast();

  const handleSuccess = (message: string) => {
    // Extract the action performed from the message for a better toast
    let toastMessage = 'Activity updated successfully!';
    
    if (message.toLowerCase().includes('started')) {
      toastMessage = '✅ Activity started successfully!';
    } else if (message.toLowerCase().includes('logged') || message.toLowerCase().includes('recorded')) {
      toastMessage = '✅ Activity logged successfully!';
    } else if (message.toLowerCase().includes('updated')) {
      toastMessage = '✅ Activity updated successfully!';
    } else if (message.toLowerCase().includes('ended') || message.toLowerCase().includes('stopped')) {
      toastMessage = '✅ Activity ended successfully!';
    }

    showToast(toastMessage, 'success');
  };

  const handleQueryResponse = (message: string) => {
    // Show query responses as info toasts with longer duration
    showToast(message, 'info');
  };

  const handleNeedsClarification = (message: string, context: any) => {
    setClarificationModal({
      isOpen: true,
      message,
      context,
    });
  };

  const closeClarificationModal = () => {
    setClarificationModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <>
      {/* Activity Cards */}
      <DashboardCards childId={childId} />

      {/* Persistent AI Input at bottom of page */}
      <PersistentAIInput
        userId={userId}
        childId={childId}
        onSuccess={handleSuccess}
        onQueryResponse={handleQueryResponse}
        onNeedsClarification={handleNeedsClarification}
      />

      {/* Clarification Modal */}
      <ClarificationModal
        isOpen={clarificationModal.isOpen}
        onClose={closeClarificationModal}
        message={clarificationModal.message}
        context={clarificationModal.context}
        onSuccess={handleSuccess}
      />
    </>
  );
}