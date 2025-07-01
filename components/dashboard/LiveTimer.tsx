'use client';

import { useTimer } from '@/lib/hooks/useTimer';

interface LiveTimerProps {
  startTime: Date;
  className?: string;
}

export default function LiveTimer({ startTime, className = '' }: LiveTimerProps) {
  const { displayText, showSeconds } = useTimer({ 
    startTime, 
    isActive: true 
  });

  return (
    <div className={`${className} ${showSeconds ? 'font-mono' : ''}`}>
      {displayText}
    </div>
  );
}