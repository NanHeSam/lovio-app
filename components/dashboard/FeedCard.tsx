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
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🍼 {feedType} - Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <LiveTimer 
              startTime={activeSession.startTime}
              className="text-2xl font-bold text-blue-600"
            />
            <div className="text-sm text-gray-600">
              Started {activeSession.durationMinutes < 60 ? `${activeSession.durationMinutes}m ago` : `${Math.floor(activeSession.durationMinutes / 60)}h ${activeSession.durationMinutes % 60}m ago`}
            </div>
            {details?.type === 'nursing' && (
              <div className="text-sm text-gray-500">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🍼 Last {feedType}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              {lastFeed.ago}
            </div>
            <div className="text-lg font-semibold">
              {details?.type === 'nursing' ? (
                `${duration}m total`
              ) : (
                `${(details as any)?.volume || 0}${(details as any)?.unit || 'ml'}`
              )}
            </div>
            {details?.type === 'nursing' && (
              <div className="text-sm text-gray-500">
                Left: {details.leftDuration || 0}m | Right: {details.rightDuration || 0}m
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🍼 Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500">
          No recent feeds
        </div>
      </CardContent>
    </Card>
  );
}