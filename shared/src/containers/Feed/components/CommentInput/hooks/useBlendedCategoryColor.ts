import { useMemo } from 'react'
import { blendCategoryColor } from '@shared/util'

/**
 * Custom hook to compute blended category color with surface container background
 * Reads the CSS variable value at runtime and blends the category color at 10% opacity
 */
export const useBlendedCategoryColor = (categoryColor: string | undefined) => {
  return useMemo(() => {
    if (!categoryColor) {
      return { primary: undefined, secondary: undefined }
    }
    const rootStyles = getComputedStyle(document.documentElement)
    const surfaceContainer = rootStyles.getPropertyValue('--md-sys-color-surface-container').trim()
    const surfaceSecondary = rootStyles
      .getPropertyValue('--md-sys-color-surface-container-high')
      .trim()

    // Fallbacks if CSS vars are missing
    const basePrimary = surfaceContainer || categoryColor
    const baseSecondary = surfaceSecondary || categoryColor

    // Blend category color at 0.1 opacity over primary, 0.5 over secondary
    const blendedPrimary = blendCategoryColor(categoryColor, basePrimary, 0.1) || categoryColor
    const blendedSecondary = blendCategoryColor(categoryColor, baseSecondary, 0.3) || categoryColor

    return {
      primary: blendedPrimary,
      secondary: blendedSecondary,
    }
  }, [categoryColor])
}
