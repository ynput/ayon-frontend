import { useMemo } from 'react'
import { blendCategoryColor } from '@shared/util'

/**
 * Custom hook to compute blended category color with surface container background
 * Reads the CSS variable value at runtime and blends the category color at 10% opacity
 */
export const useBlendedCategoryColor = (categoryColor: string | undefined) => {
  const blendedColor = useMemo(() => {
    if (!categoryColor) {
      return undefined
    }
    // Get the computed value of --md-sys-color-surface-container from the root element
    const rootStyles = getComputedStyle(document.documentElement)
    const surfaceContainer = rootStyles.getPropertyValue('--md-sys-color-surface-container').trim()

    if (!surfaceContainer) {
      // Fallback to category color if we can't get the surface container
      return categoryColor
    }

    // Blend the category color at 10% opacity over the surface container
    const blended = blendCategoryColor(categoryColor, surfaceContainer, 0.1)
    return blended || categoryColor
  }, [categoryColor])

  return blendedColor
}
