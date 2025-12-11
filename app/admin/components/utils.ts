/**
 * Utility functions for admin panel components
 */

export function makeUniqueId(base: string, existingIds: Set<string>): string {
  let candidate = base;
  let counter = 2;
  while (existingIds.has(candidate)) {
    candidate = `${base}-${counter++}`;
  }
  return candidate;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Generate a unique ID for an entity with a fallback to timestamp-based generation
 */
export function generateUniqueId(prefix: string, existingIds: Set<string>, baseName?: string): string {
  // First try to generate based on baseName if provided
  if (baseName && baseName.trim()) {
    const slugifiedBase = slugify(baseName);
    if (slugifiedBase) {
      const candidate = `${prefix}-${slugifiedBase}`;
      if (!existingIds.has(candidate)) {
        return candidate;
      }
      // If slugified base conflicts, fall back to counter-based uniqueness
      return makeUniqueId(candidate, existingIds);
    }
  }

  // Fallback: generate timestamp-based ID with uniqueness check
  let counter = 0;
  let candidate: string;
  do {
    candidate = counter === 0
      ? `${prefix}-${Date.now()}`
      : `${prefix}-${Date.now()}-${counter}`;
    counter++;
  } while (existingIds.has(candidate));

  return candidate;
}

