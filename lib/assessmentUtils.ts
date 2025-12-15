/**
 * Assessment Utilities - Pure helper functions for assessment calculations and display.
 */

import { Category, RATING_LEVELS, getLegacyRatingKey } from "./assessmentSchema";

/**
 * Get the Tailwind color class for a rating value.
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4) return "bg-green-500";
  if (rating >= 3) return "bg-blue-500";
  if (rating >= 2) return "bg-yellow-500";
  return "bg-red-500";
}

/**
 * Get the human-readable label for a rating value.
 */
export function getRatingLabel(rating: number): string {
  const level = RATING_LEVELS.find((l) => l.value === rating);
  return level?.label ?? "";
}

/**
 * Calculate the average rating for a category.
 * Uses legacy key format for backward compatibility with stored data.
 */
export function calculateCategoryAverage(
  category: Category,
  ratings: Record<string, number>
): string {
  const categoryRatings = category.skills
    .map((skill) => ratings[getLegacyRatingKey(category.name, skill.name)])
    .filter((r): r is number => r !== undefined);

  if (categoryRatings.length === 0) return "0.0";
  return (categoryRatings.reduce((a, b) => a + b, 0) / categoryRatings.length).toFixed(1);
}

/**
 * Calculate the overall average rating across all rated skills.
 */
export function calculateOverallAverage(ratings: Record<string, number>): number {
  const allRatings = Object.values(ratings).filter((r): r is number => r !== undefined);
  if (allRatings.length === 0) return 0;
  return allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
}

/**
 * Format a numeric rating for display (1 decimal place).
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}
