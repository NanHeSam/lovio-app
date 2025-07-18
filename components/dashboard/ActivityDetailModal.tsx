'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Clock, Info, ThumbsUp, ThumbsDown, MessageSquare, ExternalLink } from 'lucide-react';
import { ActiveSession, RecentActivity, FeedDetails, DiaperDetails } from '@/lib/db/types';
import { useToast } from '@/components/ui/toast';

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityType: 'sleep' | 'feed' | 'diaper';
  activeSession?: ActiveSession;
  lastActivity?: RecentActivity;
  childId?: string;
}

interface ActivityWithAI extends RecentActivity {
  aiInteraction?: {
    id: string;
    userInput: string;
    aiResponse: string;
    userFeedback: string;
    feedbackNote?: string;
    langsmithTraceId?: string;
  };
  langsmithTraceUrl?: string;
}

export default function ActivityDetailModal({
  isOpen,
  onClose,
  activityType,
  activeSession,
  lastActivity,
  childId
}: ActivityDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const [activityWithAI, setActivityWithAI] = useState<ActivityWithAI | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Fetch activity details with AI interaction data
  useEffect(() => {
    if (isOpen && lastActivity && childId) {
      const abortController = new AbortController();
      
      fetch(`/api/activities/${childId}/${lastActivity.id}`, {
        signal: abortController.signal
      })
        .then(res => res.json())
        .then(data => {
          setActivityWithAI(data);
        })
        .catch(error => {
          if (error.name !== 'AbortError') {
            console.error('Failed to fetch activity details:', error);
          }
        });
      
      return () => {
        abortController.abort();
      };
    }
  }, [isOpen, lastActivity, childId]);

  // Handle Escape key and focus management
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus the modal for screen readers
      modalRef.current?.focus();
    }
    
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const submitFeedback = async (feedback: 'thumbs_up' | 'thumbs_down', note?: string) => {
    if (!lastActivity) return;
    
    setIsSubmittingFeedback(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: lastActivity.id,
          feedback,
          note,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      await response.json();
      
      // Update local state to reflect the feedback
      setActivityWithAI(prev => prev ? {
        ...prev,
        aiInteraction: prev.aiInteraction ? {
          ...prev.aiInteraction,
          userFeedback: feedback,
          feedbackNote: note
        } : undefined
      } : null);

      showToast(
        feedback === 'thumbs_up' ? 'Thanks for the positive feedback!' : 'Thanks for the feedback! This helps us improve.',
        'success'
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast('Failed to submit feedback', 'error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (!isOpen) return null;

  const isActive = activeSession?.type === activityType;

  const getActivityIcon = () => {
    switch (activityType) {
      case 'sleep': return '😴';
      case 'feed': return '🍼';
      case 'diaper': return '👶';
    }
  };

  const getActivityTitle = () => {
    if (isActive) {
      switch (activityType) {
        case 'sleep': return 'Active Sleep Session';
        case 'feed': return 'Active Feeding Session';
        case 'diaper': return 'Diaper Activity';
      }
    } else {
      switch (activityType) {
        case 'sleep': return 'Last Sleep Session';
        case 'feed': return 'Last Feeding Session';
        case 'diaper': return 'Last Diaper Change';
      }
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getDuration = (startTime: Date, endTime?: Date | null) => {
    const end = endTime || new Date();
    const durationMs = end.getTime() - startTime.getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const renderSleepDetails = () => {
    if (isActive && activeSession) {
      const duration = getDuration(activeSession.startTime);
      return (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-800 font-medium mb-2">
              <Clock className="w-4 h-4" />
              Currently Sleeping
            </div>
            <div className="text-2xl font-bold text-purple-700 mb-1">{duration}</div>
            <div className="text-sm text-purple-600">Started at {formatTime(activeSession.startTime)}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Started</div>
              <div className="font-medium">{formatDateTime(activeSession.startTime)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-medium text-purple-600">Active</div>
            </div>
          </div>
        </div>
      );
    } else if (lastActivity) {
      const duration = getDuration(lastActivity.startTime, lastActivity.endTime);
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
              <Clock className="w-4 h-4" />
              Sleep Duration
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{duration}</div>
            <div className="text-sm text-gray-600">{lastActivity.ago}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Started</div>
              <div className="font-medium">{formatTime(lastActivity.startTime)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Ended</div>
              <div className="font-medium">{lastActivity.endTime ? formatTime(lastActivity.endTime) : 'N/A'}</div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-600">Full Date</div>
            <div className="font-medium text-blue-800">{formatDateTime(lastActivity.startTime)}</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-6xl mb-4 opacity-50">😴</div>
          <p>No recent sleep activity</p>
        </div>
      );
    }
  };

  const renderFeedDetails = () => {
    if (isActive && activeSession) {
      const duration = getDuration(activeSession.startTime);
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
              <Clock className="w-4 h-4" />
              Currently Feeding
            </div>
            <div className="text-2xl font-bold text-blue-700 mb-1">{duration}</div>
            <div className="text-sm text-blue-600">Started at {formatTime(activeSession.startTime)}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Started</div>
              <div className="font-medium">{formatDateTime(activeSession.startTime)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-medium text-blue-600">Active</div>
            </div>
          </div>
        </div>
      );
    } else if (lastActivity) {
      const details = lastActivity.details as FeedDetails;
      const duration = getDuration(lastActivity.startTime, lastActivity.endTime);
      const feedType = details?.type === 'nursing' ? 'Nursing' : 'Bottle';
      
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
              <Info className="w-4 h-4" />
              {feedType} Feeding
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {details?.type === 'nursing' ? duration : `${(details as any)?.volume || 0}${(details as any)?.unit || 'ml'}`}
            </div>
            <div className="text-sm text-gray-600">{lastActivity.ago}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Type</div>
              <div className="font-medium capitalize">{feedType}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Duration</div>
              <div className="font-medium">{duration}</div>
            </div>
          </div>

          {details?.type === 'nursing' && (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
              <div className="text-sm text-pink-600 mb-2">Nursing Details</div>
              <div className="flex justify-between text-sm">
                <span>Left: {details.leftDuration || 0}m</span>
                <span>Right: {details.rightDuration || 0}m</span>
              </div>
            </div>
          )}

          {details?.type === 'bottle' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-600 mb-2">Bottle Details</div>
              <div className="font-medium">{(details as any)?.volume || 0} {(details as any)?.unit || 'ml'}</div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-600">Full Date</div>
            <div className="font-medium text-blue-800">{formatDateTime(lastActivity.startTime)}</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-6xl mb-4 opacity-50">🍼</div>
          <p>No recent feeding activity</p>
        </div>
      );
    }
  };

  const renderDiaperDetails = () => {
    if (lastActivity) {
      const details = lastActivity.details as DiaperDetails;
      
      const getContentsEmoji = (contents: string) => {
        switch (contents) {
          case 'pee': return '💧';
          case 'poo': return '💩';
          case 'both': return '💧💩';
          default: return '👶';
        }
      };
      
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
              <Info className="w-4 h-4" />
              Diaper Change
            </div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{getContentsEmoji(details?.contents || 'pee')}</span>
              <span className="text-xl font-bold text-gray-900 capitalize">
                {details?.contents || 'Unknown'}
              </span>
            </div>
            <div className="text-sm text-gray-600">{lastActivity.ago}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Contents</div>
              <div className="font-medium capitalize">{details?.contents || 'Unknown'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Volume</div>
              <div className="font-medium capitalize">{details?.volume || 'Not specified'}</div>
            </div>
          </div>

          {details?.hasRash && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm text-red-600 mb-1">⚠️ Rash Detected</div>
              <div className="text-red-700 font-medium">Rash was present during this change</div>
            </div>
          )}

          {details?.pooColor && details?.contents !== 'pee' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-sm text-yellow-600 mb-2">Poop Details</div>
              <div className="flex justify-between text-sm">
                <span>Color: <span className="font-medium capitalize">{details.pooColor}</span></span>
                <span>Texture: <span className="font-medium capitalize">{details.pooTexture}</span></span>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-600">Full Date</div>
            <div className="font-medium text-blue-800">{formatDateTime(lastActivity.startTime)}</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-6xl mb-4 opacity-50">👶</div>
          <p>No recent diaper changes</p>
        </div>
      );
    }
  };

  const renderAIInteractionSection = () => {
    if (!activityWithAI?.aiInteraction) return null;

    const { aiInteraction } = activityWithAI;
    const hasFeedback = aiInteraction.userFeedback && aiInteraction.userFeedback !== 'none';

    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">AI Interaction</h4>
        </div>
        
        {/* User's Natural Language Query */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="text-sm text-blue-600 mb-1">What you said:</div>
          <div className="text-blue-800 font-medium">{aiInteraction.userInput}</div>
        </div>

        {/* AI Response */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="text-sm text-gray-600 mb-1">AI Response:</div>
          <div className="text-gray-800">{aiInteraction.aiResponse}</div>
        </div>

        {/* Feedback Section */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Was this activity recorded correctly?
          </div>
          
          {hasFeedback ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {aiInteraction.userFeedback === 'thumbs_up' ? '👍 Good' : '👎 Needs improvement'}
              </span>
              {activityWithAI.langsmithTraceUrl && (
                <a
                  href={activityWithAI.langsmithTraceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Trace
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => submitFeedback('thumbs_up')}
                disabled={isSubmittingFeedback}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
              >
                <ThumbsUp className="w-4 h-4" />
                Good
              </button>
              <button
                onClick={() => submitFeedback('thumbs_down')}
                disabled={isSubmittingFeedback}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
              >
                <ThumbsDown className="w-4 h-4" />
                Needs Work
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActivityDetails = () => {
    switch (activityType) {
      case 'sleep': return renderSleepDetails();
      case 'feed': return renderFeedDetails();
      case 'diaper': return renderDiaperDetails();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getActivityIcon()}</span>
            <div>
              <h3 id="modal-title" className="text-lg font-semibold">{getActivityTitle()}</h3>
              <p className="text-sm text-gray-600">Activity details and information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderActivityDetails()}
          {renderAIInteractionSection()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}