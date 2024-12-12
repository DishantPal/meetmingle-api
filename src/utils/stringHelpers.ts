export function convertToSnakeCase(input: string): string {
    return input
        .replace(/([a-z])([A-Z])/g, '$1_$2') // Add an underscore between camelCase words
        .replace(/[\s\-]+/g, '_') // Replace spaces and dashes with underscores
        .toLowerCase(); // Convert the string to lowercase
}


export function convertToTitleCase(input: string): string {
    return input
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}