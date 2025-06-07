/**
 * Creates a URL-friendly slug from any text string
 *
 * @param text - The input text to convert to a slug

 * @returns A clean, URL-safe slug string
 *
 * @example
 * createSlug("Hello, World! - A Test") // "hello-world-a-test"
 * createSlug("Café & Restaurant!") // "cafe-restaurant"
 * createSlug("   Multiple   Spaces   ") // "multiple-spaces"
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()                    // Convert to lowercase for consistency
    .normalize('NFD')                 // Normalize unicode (handles accented characters)
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritical marks (café → cafe)
    .replace(/[^a-z0-9]+/g, '-')      // Replace any non-alphanumeric sequences with single hyphen
    .replace(/^-+|-+$/g, '')          // Remove leading and trailing hyphens
    .slice(0, 100)                   // Limit to 100 characters maximum
    .replace(/-+$/, '');              // Remove trailing hyphen if slicing cut mid-word
}