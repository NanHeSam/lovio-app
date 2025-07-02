/**
 * Date and time utility functions
 */

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

/**
 * Calculate duration in minutes between two dates
 * @param startTime Start date
 * @param endTime End date (defaults to current time if not provided)
 * @returns Duration in minutes
 */
export function getDurationMinutes(startTime: Date, endTime?: Date | null): number {
  const end = endTime || new Date();
  return Math.floor((end.getTime() - startTime.getTime()) / (1000 * 60));
}

/**
 * Format a duration from minutes to a human-readable string
 * @param minutes Duration in minutes
 * @returns Formatted string like "1h 30m" or "45m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Format a time ago string from minutes
 * @param minutes Minutes ago
 * @returns Formatted string like "1h 30m ago" or "45m ago"
 */
export function formatTimeAgo(minutes: number): string {
  return `${formatDuration(minutes)} ago`;
}

/**
 * Format a date to a localized date-time string
 * @param date Date to format
 * @param locale Locale string (defaults to 'en-US')
 * @returns Formatted date-time string
 */
export function formatDateTime(date: Date, locale: string = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format a date to a localized time string
 * @param date Date to format
 * @param locale Locale string (defaults to 'en-US')
 * @returns Formatted time string
 */
export function formatTime(date: Date, locale: string = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
