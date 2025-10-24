const hexToRgb = (hex: string): [number, number, number] => {
  const normalizedHex = hex.startsWith('#') ? hex.slice(1) : hex

  if (normalizedHex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(normalizedHex)) {
    throw new Error(`Invalid hex color format: ${hex}`)
  }

  const bigint = parseInt(normalizedHex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  return [r, g, b]
}

// Calculate relative luminance according to WCAG standards
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Calculate contrast ratio between two luminance values
const getContrastRatio = (l1: number, l2: number): number => {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// WCAG AA requires 4.5:1 for normal text, 3:1 for large text
const MIN_CONTRAST_RATIO = 4.5

export const getTextColor = (backgroundColor?: string): string => {
  try {
    const [r, g, b] = hexToRgb(backgroundColor || '#ffffff')
    const bgLuminance = getLuminance(r, g, b)

    // Actual luminance values for our CSS variables
    // --surface-ground: #121212
    const darkTextLuminance = getLuminance(0x12, 0x12, 0x12)

    const contrastWithDark = getContrastRatio(bgLuminance, darkTextLuminance)

    // Choose the text color that provides better contrast
    return contrastWithDark >= MIN_CONTRAST_RATIO
      ? 'var(--surface-ground)'
      : 'var(--md-sys-color-on-surface)'
  } catch (error) {
    // Fallback to dark text on error
    return 'var(--surface-ground)'
  }
}
