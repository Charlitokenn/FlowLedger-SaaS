/**
 * Gets a greeting message based on the current time of day
 * @param date - Optional date to check. Defaults to current time.
 * @returns A greeting message appropriate for the time of day
 */
export function getTimeBasedGreeting(date: Date = new Date()): string {
    const hour = date.getHours();

    if (hour >= 1 && hour < 12) {
        return "Morning";
    } else if (hour >= 12 && hour < 17) {
        return "Afternoon";
    } else {
        return "Evening";
    }
}

/**
 * Gets a full greeting message with a name
 * @param firstName - The person's first name
 * @param date - Optional date to check. Defaults to current time.
 * @returns A personalized greeting message
 */
export function getPersonalizedGreeting(firstName: string | null | undefined, date: Date = new Date()): string {
    const timeGreeting = getTimeBasedGreeting(date);
    const name = firstName || "there";
    return `${timeGreeting}, ${name}`;
}
