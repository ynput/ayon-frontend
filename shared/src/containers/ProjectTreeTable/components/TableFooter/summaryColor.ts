// Deterministic color for enum values that have no color defined.
// Same value -> same color across renders/sessions (no flicker).
const PALETTE = [
  '#5b8def',
  '#37b679',
  '#e0a04d',
  '#d9534f',
  '#9b59b6',
  '#16a2b8',
  '#e377c2',
  '#7f8c8d',
  '#2ecc71',
  '#f06292',
]

export const colorForValue = (value: string): string => {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
