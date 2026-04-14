export const RELATIONSHIP_OPTIONS = [
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Son",
  "Daughter",
  "Husband",
  "Wife",
  "Grandfather",
  "Grandmother",
  "Uncle",
  "Aunt",
  "Nephew",
  "Niece",
  "Cousin",
  "Other",
] as const;

export type RelationshipOption = (typeof RELATIONSHIP_OPTIONS)[number];

export function normalizeRelationship(
  selected: string,
  customValue?: string | null
) {
  if (selected === "Other") {
    return (customValue || "").trim() || "Relative";
  }

  return selected.trim() || "Relative";
}