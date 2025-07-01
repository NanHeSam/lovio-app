'use client';

import { useState, useEffect } from 'react';

interface UseTimerProps {
  startTime: Date;
  isActive: boolean;
}

interface TimerResult {
  totalSeconds: number;
  totalMinutes: number;
  displayText: string;
  showSeconds: boolean;
}

export function useTimer({ startTime, isActive }: UseTimerProps): TimerResult {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const totalSeconds = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const showSeconds = totalMinutes < 10; // Show seconds for first 10 minutes

  const formatTime = (): string => {
    if (!showSeconds) {
      // After 10 minutes, show hours and minutes
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } else {
      // First 10 minutes, show minutes and seconds
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  return {
    totalSeconds,
    totalMinutes,
    displayText: formatTime(),
    showSeconds,
  };
}