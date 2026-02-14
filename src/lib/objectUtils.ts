/**
 * Set a value at a nested path within an object.
 * Supports dot notation and array index notation (e.g. "workExperience[0].jobTitle").
 * Creates intermediate objects/arrays as needed.
 * Returns a shallow copy of the top-level object.
 */
export const setNestedValue = (obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> => {
  const keys = path.split('.');
  const result = { ...obj };
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const match = key.match(/(\w+)\[(\d+)\]/);

    if (match) {
      const [, arrayName, indexStr] = match;
      const index = parseInt(indexStr, 10);
      if (!Array.isArray(current[arrayName])) {
        current[arrayName] = [];
      }
      const arr = current[arrayName] as Record<string, unknown>[];
      if (!arr[index]) {
        arr[index] = {};
      }
      current = arr[index];
    } else {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
  }

  const lastKey = keys[keys.length - 1];
  const match = lastKey.match(/(\w+)\[(\d+)\]/);

  if (match) {
    const [, arrayName, indexStr] = match;
    const index = parseInt(indexStr, 10);
    if (!Array.isArray(current[arrayName])) {
      current[arrayName] = [];
    }
    (current[arrayName] as unknown[])[index] = value;
  } else {
    current[lastKey] = value;
  }

  return result;
};
