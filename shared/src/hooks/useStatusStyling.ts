import { useEffect, RefObject } from 'react'
import { union } from 'lodash'
import type { DropdownRef } from '@ynput/ayon-react-components'
import { getTextColor } from '@shared/util'

interface UseStatusStylingProps {
  StatusValues: string[][]
  StatusOptionsObject: Record<string, { color?: string }>
  StatusSelectRef: RefObject<DropdownRef>
}

/**
 * Custom hook that applies styling to status elements in a dropdown
 * @param StatusValues - Array of status arrays from entities
 * @param StatusOptionsObject - Object mapping status names to their options (including color)
 * @param StatusSelectRef - Ref to the status dropdown component
 */
export const useStatusStyling = ({
  StatusValues,
  StatusOptionsObject,
  StatusSelectRef,
}: UseStatusStylingProps) => {
  useEffect(() => {
    const currentStatus = union(...StatusValues)
    if (currentStatus.length > 0 && StatusSelectRef.current) {
      const timeoutId = setTimeout(() => {
        const element = StatusSelectRef.current?.getElement()
        if (element) {
          const statusTextElements = element.querySelectorAll('.status-text')

          if (statusTextElements && statusTextElements.length > 0) {
            statusTextElements.forEach((textElement: Element) => {
              // Get the status name from the text content
              const statusName = textElement.textContent?.trim()
              const statusColor = statusName ? StatusOptionsObject[statusName]?.color : undefined
              if (statusColor) {
                const calculatedTextColor = getTextColor(statusColor)

                // Set text color
                const htmlElement = textElement as HTMLElement
                htmlElement.style.color = calculatedTextColor

                // Also set icon color - icon is a sibling of status-text
                const parent = htmlElement.parentElement
                if (parent) {
                  const iconElement = parent.querySelector('.status-icon') as HTMLElement
                  if (iconElement) {
                    iconElement.style.color = calculatedTextColor
                  }
                }
              }
            })
          }
        }
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [StatusValues, StatusOptionsObject, StatusSelectRef])
}
