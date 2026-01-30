import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// IST (Indian Standard Time) is UTC+5:30
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Converts a UTC date to IST
 */
export function toIST(date: Date | string | null): Date | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  return new Date(d.getTime() + IST_OFFSET_MS);
}

/**
 * Formats a timestamp to IST time string (e.g., "9:30 AM")
 */
export function formatTimeIST(date: Date | string | null, formatStr: string = 'h:mm a'): string {
  if (!date) return '-';
  const istDate = toIST(date);
  if (!istDate) return '-';
  return format(istDate, formatStr);
}

/**
 * Formats a timestamp to IST date string (e.g., "Jan 15, 2024")
 */
export function formatDateIST(date: Date | string | null, formatStr: string = 'MMM d, yyyy'): string {
  if (!date) return '-';
  const istDate = toIST(date);
  if (!istDate) return '-';
  return format(istDate, formatStr);
}

/**
 * Formats a timestamp to IST datetime string (e.g., "Jan 15, 2024, 9:30 AM")
 */
export function formatDateTimeIST(date: Date | string | null, formatStr: string = 'MMM d, yyyy, h:mm a'): string {
  if (!date) return '-';
  const istDate = toIST(date);
  if (!istDate) return '-';
  return format(istDate, formatStr);
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
  return format(date, formatStr);
}

/**
 * Gets current time in IST
 */
export function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET_MS);
}

/**
 * Formats currency in Indian format
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
