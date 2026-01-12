export const zodToProperCase = (str: string): string => {
    return str
        .trim()
        .toLowerCase()
        .split(' ')
        .filter(word => word.length > 0) // Remove extra spaces
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};