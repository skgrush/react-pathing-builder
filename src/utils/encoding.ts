const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/'
const SPACE_RE = /\s/

/**
 * Convert a number to a base64 string.
 */
export function base64(V: number, rest = ''): string {
  const mod = V % 64,
    remaining = Math.floor(V / 64)
  rest = CHARS.charAt(mod) + rest
  return remaining <= 0 ? rest : base64(remaining, rest)
}

/**
 * Generate a probably unique AND SHORT identifier.
 */
export function b64time() {
  return base64(Date.now() % 1e11)
}

/**
 * Safe JSON function that returns an error string on error.
 */
export function toJSON(data: object, space?: string | number) {
  try {
    return JSON.stringify(data, undefined, space)
  } catch (e) {
    return `"${e.name}: ${e.message}"`
  }
}

/**
 * Quotes/escapes a string if necessary, otherwise returns it.
 */
export function stringifyish(str: string): string {
  if (!SPACE_RE.test(str)) return str
  return JSON.stringify(str)
}
