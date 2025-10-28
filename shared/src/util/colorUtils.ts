/**
 * Parse a hex color string to RGB components
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  // Remove # if present
  hex = hex.replace(/^#/, '')

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  // Parse 6-digit hex
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return { r, g, b }
  }

  return null
}

/**
 * Parse a CSS color string (hex or rgb/rgba) to RGB components
 */
export const parseColor = (color: string): { r: number; g: number; b: number } | null => {
  // Handle hex colors
  if (color.startsWith('#')) {
    return hexToRgb(color)
  }

  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    }
  }

  return null
}

/**
 * Blend two colors together with alpha compositing
 * Formula: result = foreground * alpha + background * (1 - alpha)
 */
export const blendColors = (
  foreground: { r: number; g: number; b: number },
  background: { r: number; g: number; b: number },
  alpha: number,
): { r: number; g: number; b: number } => {
  return {
    r: Math.round(foreground.r * alpha + background.r * (1 - alpha)),
    g: Math.round(foreground.g * alpha + background.g * (1 - alpha)),
    b: Math.round(foreground.b * alpha + background.b * (1 - alpha)),
  }
}

/**
 * Convert RGB components to hex color string
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Blend a category color at 10% opacity over a background color
 * This simulates the Figma design where category color is overlaid with 10% opacity
 */
export const blendCategoryColor = (
  categoryColor: string,
  backgroundColor: string,
  opacity: number = 0.1,
): string | null => {
  const fg = parseColor(categoryColor)
  const bg = parseColor(backgroundColor)

  if (!fg || !bg) {
    return null
  }

  const blended = blendColors(fg, bg, opacity)
  return rgbToHex(blended.r, blended.g, blended.b)
}
