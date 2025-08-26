import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

/**
 * Formats a date string to avoid timezone issues
 * Uses the date parts directly to avoid timezone conversion
 */
export function formatEventDate(dateString: string | null | undefined): string {
  if (!dateString) return "TBA"

  try {
    // Parse the date string (YYYY-MM-DD format) directly without timezone conversion
    const dateParts = dateString.split("-")
    if (dateParts.length !== 3) {
      return "TBA"
    }

    const year = parseInt(dateParts[0], 10)
    const month = parseInt(dateParts[1], 10) - 1 // Month is 0-indexed
    const day = parseInt(dateParts[2], 10)

    // Create date using local timezone
    const date = new Date(year, month, day)

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "TBA"
  }
}

/**
 * Converts a date string to ISO format for date inputs
 * Ensures the date stays consistent regardless of timezone
 */
export function toDateInputValue(dateString: string | null | undefined): string {
  if (!dateString) return ""

  try {
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }

    // Otherwise, try to parse and format
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return ""
    }

    // Format as YYYY-MM-DD in local timezone
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  } catch (error) {
    console.error("Error converting date to input value:", error)
    return ""
  }
}
