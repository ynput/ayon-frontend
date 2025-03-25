// accepts foreground hex color string and background color string
// ensures that the text is readable by checking the lightness of the background color against the lightness of the foreground color
// increase the lightness of the foreground color if it is too dark
function checkColorBrightness(foregroundHex: string, backgroundHex: string): string {
  // Helper function to convert hex to HSL
  function hexToHsl(hex: string): { h: number; s: number; l: number } {
    let r = parseInt(hex.slice(1, 3), 16) / 255
    let g = parseInt(hex.slice(3, 5), 16) / 255
    let b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0,
      s = 0,
      l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return { h: h * 360, s: s * 100, l: l * 100 }
  }

  // Helper function to convert HSL to hex
  function hslToHex(h: number, s: number, l: number): string {
    s /= 100
    l /= 100

    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2
    let r = 0,
      g = 0,
      b = 0

    if (0 <= h && h < 60) {
      r = c
      g = x
      b = 0
    } else if (60 <= h && h < 120) {
      r = x
      g = c
      b = 0
    } else if (120 <= h && h < 180) {
      r = 0
      g = c
      b = x
    } else if (180 <= h && h < 240) {
      r = 0
      g = x
      b = c
    } else if (240 <= h && h < 300) {
      r = x
      g = 0
      b = c
    } else if (300 <= h && h < 360) {
      r = c
      g = 0
      b = x
    }

    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`
  }

  // Convert hex colors to HSL
  const foregroundHsl = hexToHsl(foregroundHex)
  const backgroundHsl = hexToHsl(backgroundHex)

  const contrast = 50
  // If the foreground lightness is too low compared to the background, increase its lightness
  if (foregroundHsl.l < backgroundHsl.l + contrast) {
    // increase the lightness to make the color more visible
    foregroundHsl.l = Math.min(
      100,
      foregroundHsl.l + (backgroundHsl.l + contrast - foregroundHsl.l),
    )
    // increase the saturation to make the color more vibrant
    foregroundHsl.s = Math.min(100, foregroundHsl.s + 10)
  }

  return hslToHex(foregroundHsl.h, foregroundHsl.s, foregroundHsl.l)
}

export default checkColorBrightness
