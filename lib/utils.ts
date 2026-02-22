import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isThisYear } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(ts: number): string {
  const date = new Date(ts);
  if (isToday(date)) {
    return format(date, "p");
  }
  if (isThisYear(date)) {
    return format(date, "MMM d, p");
  }
  return format(date, "MMM d, yyyy, p");
}
