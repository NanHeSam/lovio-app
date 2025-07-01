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
        <p className="text-red-800 mb-3">Error loading dashboard: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
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