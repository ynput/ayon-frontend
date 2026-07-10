// Swaps {root[name]} tokens in a rootless path for concrete per-OS root values.
export const replaceRoot = (
  input?: string | null,
  roots: Record<string, string | undefined> = {},
): string | undefined => {
  if (!input) return input ?? undefined
  return input.replace(/\{root\[(.*?)\]\}/g, (match, name) => {
    const value = roots[name]
    return value ? value.replace(/[\\/]+$/, '') : match
  })
}
