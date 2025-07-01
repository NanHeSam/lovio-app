import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentActivity, ActiveSession, FeedDetails } from "@/lib/db/types";
import LiveTimer from "./LiveTimer";

// Helper function to get duration in minutes
const getDurationMinutes = (startTime: Date, endTime?: Date | null): number => {
  const end = endTime || new Date();
  return Math.floor((end.getTime() - startTime.getTime()) / (1000 * 60));
};

interface FeedCardProps {
  activeSession?: ActiveSession;
  lastFeed?: RecentActivity;
}

export default function FeedCard({ activeSession, lastFeed }: FeedCardProps) {
  const isActive = activeSession?.type === 'feed';
  
  if (isActive && activeSession) {
    const details = lastFeed?.details as FeedDetails;
    const feedType = details?.type === 'nursing' ? 'Nursing' : 'Bottle';
    
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <span className="text-2xl">🍼</span>
            <span className="text-lg font-bold">{feedType} - Active</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <LiveTimer 
              startTime={activeSession.startTime}
              className="text-3xl font-bold text-blue-700 tracking-tight"
            />
            <div className="text-sm text-blue-600 font-medium">
              Started {activeSession.durationMinutes < 60 ? `${activeSession.durationMinutes}m ago` : `${Math.floor(activeSession.durationMinutes / 60)}h ${activeSession.durationMinutes % 60}m ago`}
            </div>
            {details?.type === 'nursing' && (
              <div className="text-sm text-blue-600 bg-blue-50 rounded-lg p-2">
                Left: {details.leftDuration || 0}m | Right: {details.rightDuration || 0}m
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lastFeed) {
    const details = lastFeed.details as FeedDetails;
    const feedType = details?.type === 'nursing' ? 'Nursing' : 'Bottle';
    const duration = getDurationMinutes(lastFeed.startTime, lastFeed.endTime);
    
    return (
      <Card className="hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <span className="text-2xl">🍼</span>
            <span className="text-lg font-bold">Last {feedType}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-sm text-gray-600 font-medium">
              {lastFeed.ago}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {details?.type === 'nursing' ? (
                `${duration}m`
              ) : (
                `${(details as any)?.volume || 0}${(details as any)?.unit || 'ml'}`
              )}
            </div>
            {details?.type === 'nursing' && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                Left: {details.leftDuration || 0}m | Right: {details.rightDuration || 0}m
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gray-600">
          <span className="text-2xl opacity-50">🍼</span>
          <span className="text-lg font-bold">Feed</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-gray-500">
          No recent feeds
        </div>
      </CardContent>
    </Card>
  );
}