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

type StringifyReplacer = (key: string, value: any) => any
/**
 * Safe JSON function that returns an error string on error.
 */
export function toJSON(
  data: object,
  space?: string | number,
  replacer?: StringifyReplacer
) {
  try {
    return JSON.stringify(data, replacer, space)
  } catch (e) {
    return `"${e.name}: ${e.message}"`
  }
}

/**
 * Quotes/escapes a string if necessary, otherwise returns it.
 */
export function stringier(str: string): string {
  if (!SPACE_RE.test(str)) return str
  return JSON.stringify(str)
}

/**
 * Take a pair of 'key' and 'name' stringier them, or one if they're the same.
 */
export function describeKeyName(key: string, name: string = key): string {
  const k = stringier(key)
  if (key === name) {
    return k
  }
  const n = stringier(name)
  return `${n} (${k})`
}
