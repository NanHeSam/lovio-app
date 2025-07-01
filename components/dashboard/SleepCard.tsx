import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ActiveSession } from "@/lib/db/types";
import { formatTimeAgo, getDurationMinutes } from "@/lib/mock-data";
import LiveTimer from "./LiveTimer";

interface SleepCardProps {
  activeSession?: ActiveSession;
  lastSleep?: Activity;
}

export default function SleepCard({ activeSession, lastSleep }: SleepCardProps) {
  const isActive = activeSession?.type === 'sleep';
  
  if (isActive && activeSession) {
    return (
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            😴 Sleep - Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <LiveTimer 
              startTime={activeSession.startTime}
              className="text-2xl font-bold text-purple-600"
            />
            <div className="text-sm text-gray-600">
              Started {formatTimeAgo(activeSession.startTime)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lastSleep) {
    const duration = getDurationMinutes(lastSleep.startTime, lastSleep.endTime);
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            😴 Last Sleep
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              {formatTimeAgo(lastSleep.startTime)}
            </div>
            <div className="text-lg font-semibold">
              Slept for {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          😴 Sleep
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500">
          No recent sleep
        </div>
      </CardContent>
    </Card>
  );
}