import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get current local time with timezone offset in ISO format
 * Example: "2025-07-01T15:27:47.114-08:00" (PST)
 * This is client-side only and will not work on the server
 */
export function getLocalTimeWithTimezone(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const sign = offset > 0 ? '-' : '+';
  const hours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
  const minutes = (Math.abs(offset) % 60).toString().padStart(2, '0');
  
  // Create local time by adjusting for timezone offset
  const localTime = new Date(now.getTime() - (offset * 60000));
  const isoString = localTime.toISOString().slice(0, -1);
  return `${isoString}${sign}${hours}:${minutes}`;
}
