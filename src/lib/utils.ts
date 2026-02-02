import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as dateFnsFormat } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// IST timezone identifier
const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Converts a UTC date to IST Date object
 * Note: The returned Date object represents the IST time
 */
export function toIST(date: Date | string | null): Date | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  return toZonedTime(d, IST_TIMEZONE);
}

/**
 * Formats a timestamp to IST time string (e.g., "9:30 AM")
 * Always shows IST time regardless of user's local timezone
 */
export function formatTimeIST(date: Date | string | null, formatStr: string = 'h:mm a'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return formatInTimeZone(d, IST_TIMEZONE, formatStr);
}

/**
 * Formats a timestamp to IST date string (e.g., "Jan 15, 2024")
 * Always shows IST date regardless of user's local timezone
 */
export function formatDateIST(date: Date | string | null, formatStr: string = 'MMM d, yyyy'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return formatInTimeZone(d, IST_TIMEZONE, formatStr);
}

/**
 * Formats a timestamp to IST datetime string (e.g., "Jan 15, 2024, 9:30 AM")
 * Always shows IST datetime regardless of user's local timezone
 */
export function formatDateTimeIST(date: Date | string | null, formatStr: string = 'MMM d, yyyy, h:mm a'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return formatInTimeZone(d, IST_TIMEZONE, formatStr);
}

/**
 * Formats a time-only string (HH:mm or HH:mm:ss) to readable format
 * Used for time fields stored without date (e.g., work_start_time, shoot_time)
 */
export function formatTimeOnlyIST(time: string | null, formatStr: string = 'h:mm a'): string {
  if (!time) return '-';
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return dateFnsFormat(date, formatStr);
}

/**
 * Gets current time in IST as a Date object
 */
export function nowIST(): Date {
  return toZonedTime(new Date(), IST_TIMEZONE);
}

/**
 * Creates a UTC timestamp representing midnight IST for a given date
 * Use this when storing dates that should be in IST context
 */
export function toISTMidnightUTC(date: Date): Date {
  // Extract local date components (what the user sees/selects)
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  // IST is UTC+5:30, so midnight IST = 18:30 UTC previous day
  // Create midnight UTC for that date, then subtract 5.5 hours
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  return new Date(Date.UTC(year, month, day, 0, 0, 0) - IST_OFFSET_MS);
}

/**
 * Formats currency in Indian format
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Working week configuration
 * Working days: Monday (1) to Saturday (6)
 * Holiday: Sunday (0)
 */
export function isSundayHoliday(date: Date): boolean {
  return date.getDay() === 0; // 0 = Sunday
}

export function isWorkingDay(date: Date): boolean {
  return date.getDay() !== 0; // All days except Sunday
}

/**
 * Get week day labels with Sunday highlighted as holiday
 */
export const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Check if a day header should be styled as holiday
 */
export function isDayHeaderHoliday(dayName: string): boolean {
  return dayName === 'Sun';
}
