import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const protocol =
  process.env.NODE_ENV === 'production' ? 'https' : 'http';
export const rootDomain =
  process.env.NEXT_PUBLIC_API_ENDPOINT || 'localhost:3000';

export const toProperCase = (text: string | null | undefined) => {
  if (!text) return "";
  return text.replace(
    /\w\S*/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
};

export const getNameInitials = (name: string, count = 2) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");
  const filtered = initials.replace(/[^a-zA-Z]/g, "");
  return filtered.slice(0, count).toUpperCase();
};

export const currencyNumber = (
  value: number,
  options?: Intl.NumberFormatOptions
) => {
  if (
    typeof Intl === "object" &&
    Intl &&
    typeof Intl.NumberFormat === "function"
  ) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0, // Ensures no decimal places
      maximumFractionDigits: 0, // Ensures no decimal places
      ...options,
    }).format(value);
  }

  return `TZS ${value.toLocaleString("en-US")}`;
};

export const thousandSeparator = (
  value: number,
  options?: Intl.NumberFormatOptions
) => {
  if (
    typeof Intl == "object" &&
    Intl &&
    typeof Intl.NumberFormat == "function"
  ) {
    return new Intl.NumberFormat("en-US", {
      useGrouping: true, // Enable thousand separator
      ...options,
    }).format(value);
  }

  return value.toString();
};

export const getLastLetter = (word: string): string => {
  return word.length > 0 ? word[word.length - 1] : "";
};

export const addSpacesBeforeCapitals = (input: string): string => {
  return input.replace(/(?!^)([A-Z])/g, " $1");
};

export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  // Use 'en-US' for English month names
  return new Intl.DateTimeFormat("en-US", options).format(date);
  // .replace(",", ""); // Remove comma after day
};

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  // Use 'en-US' for English month names
  return new Intl.DateTimeFormat("en-US", options).format(date);
  // .replace(",", ""); // Remove comma after day
};

export function timeUntil(targetDate: string | Date): string {
  const MS_PER_DAY = 86400000; // 1000 * 60 * 60 * 24
  const DAYS_IN_MONTH = 30;

  const today = new Date();
  const future = new Date(targetDate);

  // Reset time to midnight for accurate comparison
  today.setHours(0, 0, 0, 0);
  future.setHours(0, 0, 0, 0);

  const diffDays = Math.max(
    0,
    Math.ceil((future.getTime() - today.getTime()) / MS_PER_DAY)
  );

  return diffDays > DAYS_IN_MONTH
    ? `${Math.floor(diffDays / DAYS_IN_MONTH)} month${diffDays >= 60 ? "s" : ""
    }`
    : `${diffDays} day${diffDays === 1 ? "" : "s"}`;
}

export const timestampToDateString = (timestamp: string): string => {
  const date = new Date(parseInt(timestamp));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};