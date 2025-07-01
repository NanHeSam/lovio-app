'use client';

import { useDashboard } from '@/lib/hooks/useDashboard';
import FeedCard from './FeedCard';
import SleepCard from './SleepCard';
import DiaperCard from './DiaperCard';

interface DashboardCardsProps {
  childId: string;
}

export default function DashboardCards({ childId }: DashboardCardsProps) {
  const { data, loading, error } = useDashboard(childId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading dashboard: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-red-600 hover:text-red-800 underline"
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
    <div className="grid grid-cols-1 gap-4">
      <SleepCard 
        activeSession={activeSessions.find(s => s.type === 'sleep')}
        lastSleep={lastSleep}
      />
      <FeedCard 
        activeSession={activeSessions.find(s => s.type === 'feed')}
        lastFeed={lastFeed}
      />
      <DiaperCard 
        lastDiaper={lastDiaper}
      />
    </div>
  );
}