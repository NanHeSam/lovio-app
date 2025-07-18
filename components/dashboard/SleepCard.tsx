import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentActivity, ActiveSession } from "@/lib/db/types";
import LiveTimer from "./LiveTimer";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { getDurationMinutes, formatTimeAgo, formatDuration } from "@/lib/utils/datetime";

interface SleepCardProps {
  activeSession?: ActiveSession;
  lastSleep?: RecentActivity;
  onClick?: () => void;
  onStopSession?: (sessionId: string) => Promise<void>;
  onEditActivity?: (activity: RecentActivity) => void;
  onDeleteActivity?: (activity: RecentActivity) => void;
}

export default function SleepCard({ activeSession, lastSleep, onClick, onStopSession, onEditActivity, onDeleteActivity }: SleepCardProps) {
  const isActive = activeSession?.type === 'sleep';
  
  const handleStopClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (activeSession && onStopSession) {
      await onStopSession(activeSession.id);
    }
  };
  
  if (isActive && activeSession) {
    return (
      <Card 
        className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-200 cursor-pointer"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-purple-800">
            <div className="flex items-center gap-2">
              <span className="text-2xl">😴</span>
              <span className="text-lg font-bold">Sleep - Active</span>
            </div>
            <Button
              onClick={handleStopClick}
              size="sm"
              variant="outline"
              className="bg-white hover:bg-purple-50 border-purple-300 text-purple-700 hover:text-purple-800"
            >
              Stop
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <LiveTimer 
              startTime={activeSession.startTime}
              className="text-3xl font-bold text-purple-700 tracking-tight"
            />
            <div className="text-sm text-purple-600 font-medium">
              Started {formatTimeAgo(activeSession.durationMinutes)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lastSleep) {
    const duration = getDurationMinutes(lastSleep.startTime, lastSleep.endTime);
    
    return (
      <Card 
        className="hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-2xl">😴</span>
              <span className="text-lg font-bold">Last Sleep</span>
            </div>
            <div className="flex gap-1">
              {onEditActivity && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditActivity(lastSleep);
                  }}
                  size="sm"
                  variant="outline"
                  className="p-2 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDeleteActivity && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteActivity(lastSleep);
                  }}
                  size="sm"
                  variant="outline"
                  className="p-2 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-sm text-gray-600 font-medium">
              {lastSleep.ago}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(duration)}
            </div>
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
          <span className="text-2xl opacity-50">😴</span>
          <span className="text-lg font-bold">Sleep</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-gray-500">
          No recent sleep
        </div>
      </CardContent>
    </Card>
  );
}