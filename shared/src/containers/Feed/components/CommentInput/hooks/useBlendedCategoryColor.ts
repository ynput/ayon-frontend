import { useMemo } from 'react'

/**
 * The category color blended over the comment surfaces: 10% over surface-container, 20% over
 * surface-container-high. CSS color-mix, so it follows the theme (and nested theme scopes).
 */
export const useBlendedCategoryColor = (categoryColor: string | undefined) => {
  return useMemo(() => {
    if (!categoryColor) {
      return { primary: undefined, secondary: undefined }
    }

    return {
      primary: `color-mix(in srgb, ${categoryColor} 10%, var(--md-sys-color-surface-container))`,
      secondary: `color-mix(in srgb, ${categoryColor} 20%, var(--md-sys-color-surface-container-high))`,
    }
  }, [categoryColor])
}
