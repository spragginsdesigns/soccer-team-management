/**
 * Assessment Schema - Single source of truth for assessment categories, skills, and ratings.
 * All assessment pages should import from this module to ensure consistency.
 */

export interface Skill {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  skills: Skill[];
}

export interface RatingLevel {
  value: number;
  label: string;
  colorClass: string;
}

/**
 * Assessment categories with their associated skills.
 * Each skill has a stable ID for data storage and a display name.
 */
export const ASSESSMENT_CATEGORIES: Category[] = [
  {
    id: "technical",
    name: "Technical Skills",
    skills: [
      { id: "ball-control", name: "Ball Control & First Touch" },
      { id: "passing", name: "Passing (short & long)" },
      { id: "dribbling", name: "Dribbling" },
      { id: "shooting", name: "Shooting" },
      { id: "heading", name: "Heading" },
      { id: "weak-foot", name: "Weak Foot Ability" },
    ],
  },
  {
    id: "tactical",
    name: "Tactical Understanding",
    skills: [
      { id: "positioning", name: "Positioning & Awareness" },
      { id: "decision-making", name: "Decision Making" },
      { id: "off-ball-movement", name: "Off-the-Ball Movement" },
      { id: "defensive-org", name: "Defensive Organization" },
      { id: "attacking-support", name: "Attacking Support" },
      { id: "game-reading", name: "Game Reading" },
    ],
  },
  {
    id: "physical",
    name: "Physical Attributes",
    skills: [
      { id: "speed", name: "Speed & Acceleration" },
      { id: "stamina", name: "Stamina & Endurance" },
      { id: "strength", name: "Strength" },
      { id: "agility", name: "Agility & Balance" },
      { id: "jumping", name: "Jumping Ability" },
      { id: "fitness", name: "Overall Fitness" },
    ],
  },
  {
    id: "mental",
    name: "Mental & Psychological",
    skills: [
      { id: "concentration", name: "Concentration & Focus" },
      { id: "confidence", name: "Confidence" },
      { id: "composure", name: "Composure Under Pressure" },
      { id: "teamwork", name: "Teamwork & Communication" },
      { id: "coachability", name: "Coachability" },
      { id: "leadership", name: "Leadership" },
    ],
  },
];

/**
 * Rating levels with labels and colors.
 * Scale: 1-5
 */
export const RATING_LEVELS: RatingLevel[] = [
  { value: 1, label: "Needs Development", colorClass: "bg-red-500" },
  { value: 2, label: "Developing", colorClass: "bg-yellow-500" },
  { value: 3, label: "Competent", colorClass: "bg-blue-500" },
  { value: 4, label: "Advanced", colorClass: "bg-green-500" },
  { value: 5, label: "Elite", colorClass: "bg-green-500" },
];

/**
 * Legacy key format used in existing data.
 * Format: "{Category Name}-{Skill Name}"
 * This maintains backward compatibility with stored assessments.
 */
export function getLegacyRatingKey(categoryName: string, skillName: string): string {
  return `${categoryName}-${skillName}`;
}

/**
 * Get all skills as a flat list with their category context.
 */
export function getAllSkillsFlat(): Array<{ category: Category; skill: Skill }> {
  return ASSESSMENT_CATEGORIES.flatMap((category) =>
    category.skills.map((skill) => ({ category, skill }))
  );
}

/**
 * Get total number of skills across all categories.
 */
export function getTotalSkillCount(): number {
  return ASSESSMENT_CATEGORIES.reduce((acc, cat) => acc + cat.skills.length, 0);
}
