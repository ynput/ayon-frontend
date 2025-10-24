import { useEffect, RefObject } from 'react'
import { union } from 'lodash'
import type { DropdownRef } from '@ynput/ayon-react-components'

interface UseTagStylingProps {
  tagsValues: string[][]
  tagsOptionsObject: Record<string, { color?: string }>
  tagsSelectRef: RefObject<DropdownRef>
}

/**
 * Custom hook that applies styling to tag elements in a dropdown
 * @param tagsValues - Array of tag arrays from entities
 * @param tagsOptionsObject - Object mapping tag names to their options (including color)
 * @param tagsSelectRef - Ref to the tags dropdown component
 */
export const useTagStyling = ({
  tagsValues,
  tagsOptionsObject,
  tagsSelectRef,
}: UseTagStylingProps) => {
  useEffect(() => {
    const currentTags = union(...tagsValues)
    if (currentTags.length > 0 && tagsSelectRef.current) {
      const timeoutId = setTimeout(() => {
        const element = tagsSelectRef.current?.getElement()
        if (element) {
          const tagElements = element.querySelectorAll('.tag')

          if (tagElements && tagElements.length > 0) {
            tagElements.forEach((tagElement: Element, index: number) => {
              const tagName = currentTags[index]
              const tagColor = tagsOptionsObject[tagName]?.color
              if (tagColor) {
                const htmlElement = tagElement as HTMLElement
                htmlElement.style.backgroundColor = tagColor
                htmlElement.style.color = 'var(--color-tag-text)'
              }
            })
          }
        }
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [tagsValues, tagsOptionsObject, tagsSelectRef])
}
