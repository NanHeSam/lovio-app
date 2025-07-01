import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentActivity, ActiveSession } from "@/lib/db/types";
import LiveTimer from "./LiveTimer";

// Helper function to get duration in minutes
const getDurationMinutes = (startTime: Date, endTime?: Date | null): number => {
  const end = endTime || new Date();
  return Math.floor((end.getTime() - startTime.getTime()) / (1000 * 60));
};

interface SleepCardProps {
  activeSession?: ActiveSession;
  lastSleep?: RecentActivity;
}

export default function SleepCard({ activeSession, lastSleep }: SleepCardProps) {
  const isActive = activeSession?.type === 'sleep';
  
  if (isActive && activeSession) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <span className="text-2xl">😴</span>
            <span className="text-lg font-bold">Sleep - Active</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <LiveTimer 
              startTime={activeSession.startTime}
              className="text-3xl font-bold text-purple-700 tracking-tight"
            />
            <div className="text-sm text-purple-600 font-medium">
              Started {activeSession.durationMinutes < 60 ? `${activeSession.durationMinutes}m ago` : `${Math.floor(activeSession.durationMinutes / 60)}h ${activeSession.durationMinutes % 60}m ago`}
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
      <Card className="hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <span className="text-2xl">😴</span>
            <span className="text-lg font-bold">Last Sleep</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-sm text-gray-600 font-medium">
              {lastSleep.ago}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 hover:shadow-md transition-all duration-200">
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