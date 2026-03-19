import { createContext, FC, ReactNode, useContext, useRef, useCallback } from 'react'

interface VPFocusContextValue {
  versionsTableRef: React.RefObject<HTMLDivElement>
  gridContainerRef: React.RefObject<HTMLDivElement>
  focusVersionsTable: () => void
  focusGrid: () => void
}

const VPFocusContext = createContext<VPFocusContextValue | null>(null)

export const useVPFocusContext = () => {
  const context = useContext(VPFocusContext)
  if (!context) {
    throw new Error('useVPFocusContext must be used within VPFocusProvider')
  }
  return context
}

interface VPFocusProviderProps {
  children: ReactNode
}

export const VPFocusProvider: FC<VPFocusProviderProps> = ({ children }) => {
  const versionsTableRef = useRef<HTMLDivElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)

  const focusVersionsTable = useCallback(() => {
    if (!versionsTableRef.current) return

    // Small delay to ensure the table has rendered
    requestAnimationFrame(() => {
      if (!versionsTableRef.current) return

      // Try multiple strategies to find a focusable element

      // 1. Try to find a selected row first
      let targetElement = versionsTableRef.current.querySelector(
        'tr .selected[tabindex]',
      ) as HTMLElement

      // 2. If no selected row, find any row with tabindex
      if (!targetElement) {
        targetElement = versionsTableRef.current.querySelector('tr [tabindex="0"]') as HTMLElement
      }

      // 3. If still nothing, try to find any focusable element in the table
      if (!targetElement) {
        targetElement = versionsTableRef.current.querySelector(
          '[tabindex]:not([tabindex="-1"])',
        ) as HTMLElement
      }

      // Focus the found element
      if (targetElement) {
        targetElement.focus()

        // Scroll into view if needed
        targetElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    })
  }, [])

  const focusGrid = useCallback(() => {
    if (!gridContainerRef.current) return

    requestAnimationFrame(() => {
      if (!gridContainerRef.current) return

      // Try to find a selected entity card (EntityCard with isActive prop adds .active class)
      let targetElement = gridContainerRef.current.querySelector(
        '.entity-card.active',
      ) as HTMLElement

      // If no selected card, try any entity card
      if (!targetElement) {
        targetElement = gridContainerRef.current.querySelector('.entity-card') as HTMLElement
      }

      // If still no card found, try divs with data-entity-id
      if (!targetElement) {
        targetElement = gridContainerRef.current.querySelector('[data-entity-id]') as HTMLElement
      }

      // Focus the found element or the grid container itself
      if (targetElement) {
        targetElement.focus()
        targetElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      } else {
        // Fallback to focusing the grid container
        gridContainerRef.current.focus()
      }
    })
  }, [])

  return (
    <VPFocusContext.Provider
      value={{ versionsTableRef, gridContainerRef, focusVersionsTable, focusGrid }}
    >
      {children}
    </VPFocusContext.Provider>
  )
}
