const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/'

export function base64(V: number, rest = ''): string {
  const mod = V % 64,
    remaining = Math.floor(V / 64)
  rest = CHARS.charAt(mod) + rest
  return remaining <= 0 ? rest : base64(remaining, rest)
}
