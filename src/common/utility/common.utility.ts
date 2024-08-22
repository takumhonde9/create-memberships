/**
 * parse string to JSON object.
 * @param data a string to parse.
 *
 * @returns a JSON object or null if it fails to parse.
 */
export function toObject<T>(data: any): T {
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    return null;
  }
}

/**
 * Check if an item is defined.
 *
 * @param x any data item.
 */
export function defined(x: any) {
  return x !== undefined;
}
