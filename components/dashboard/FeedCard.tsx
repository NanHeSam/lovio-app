import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentActivity, ActiveSession, FeedDetails } from "@/lib/db/types";
import LiveTimer from "./LiveTimer";
import { Button } from "@/components/ui/button";
import { getDurationMinutes, formatTimeAgo } from "@/lib/utils/datetime";

// Type guard to ensure we really have FeedDetails
const isFeedDetails = (details: any): details is FeedDetails => {
  return details != null && typeof details === 'object' && 'type' in details;
};

interface FeedCardProps {
  activeSession?: ActiveSession;
  lastFeed?: RecentActivity;
  onClick?: () => void;
  onStopSession?: (sessionId: string) => Promise<void>;
}

export default function FeedCard({ activeSession, lastFeed, onClick, onStopSession }: FeedCardProps) {
  const isActive = activeSession?.type === 'feed';
  
  const handleStopClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (activeSession && onStopSession) {
      await onStopSession(activeSession.id);
    }
  };
  
  if (isActive && activeSession) {
    const details = isFeedDetails(activeSession.details)
      ? activeSession.details
      : undefined;
    const feedType = details?.type === 'nursing' ? 'Nursing' : 'Bottle';
    
    return (
      <Card 
        className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-200 cursor-pointer"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-blue-800">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍼</span>
              <span className="text-lg font-bold">{feedType} - Active</span>
            </div>
            <Button
              onClick={handleStopClick}
              size="sm"
              variant="outline"
              className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700 hover:text-blue-800"
            >
              Stop
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <LiveTimer 
              startTime={activeSession.startTime}
              className="text-3xl font-bold text-blue-700 tracking-tight"
            />
            <div className="text-sm text-blue-600 font-medium">
              Started {formatTimeAgo(getDurationMinutes(activeSession.startTime))}
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
    const details = isFeedDetails(lastFeed.details)
      ? lastFeed.details
      : undefined;
    const feedType = details?.type === 'nursing' ? 'Nursing' : 'Bottle';
    const duration = getDurationMinutes(lastFeed.startTime, lastFeed.endTime);
    
    return (
      <Card 
        className="hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={onClick}
      >
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
                `${details && 'volume' in details ? details.volume || 0 : 0}${details && 'unit' in details ? details.unit || 'ml' : 'ml'}`
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
    <Card 
      className="border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
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