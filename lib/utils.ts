import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const protocol =
  process.env.NODE_ENV === 'production' ? 'https' : 'http';

// Base host (marketing site), without org subdomain.
// In production prefer NEXT_PUBLIC_BASE_DOMAIN (e.g. "flowledger.com").
// Fallback to NEXT_PUBLIC_API_ENDPOINT, then localhost:3000 for dev.
export const rootDomain =
  process.env.NEXT_PUBLIC_BASE_DOMAIN ||
  process.env.NEXT_PUBLIC_API_ENDPOINT ||
  'localhost:3000';

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

export function getInitials(name: string) {
  return name
      .trim()
      .split(/\s+/) // Split by one or more whitespace characters
      .filter(word => word.length > 0) // Remove empty strings
      .map(word => word.charAt(0).toUpperCase())
      .join('');
}

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

export function formatDate(date : string) {
  const d = new Date(date);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

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

export function formatInternationalWithSpaces(
    input: string
): string | null {
  if (!input) return null;

  // Remove everything except digits
  const digits = input.replace(/\D+/g, "");

  // E.164 max length is 15 digits
  if (digits.length < 8 || digits.length > 15) return null;

  // Add +
  const withPlus = `+${digits}`;

  // Validate E.164
  if (!/^\+[1-9]\d{7,14}$/.test(withPlus)) return null;

  // Add spaces: +CCC XXX XXX XXXX (best-effort)
  return withPlus.replace(
      /^\+(\d{1,3})(\d{3})(\d{3})(\d+)$/,
      "+$1 $2 $3 $4"
  );
}
