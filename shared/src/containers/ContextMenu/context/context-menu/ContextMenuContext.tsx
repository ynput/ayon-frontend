import React, { useRef, useState, ReactNode, RefObject } from 'react'
import { CONTEXT_MENU_TARGET_ATTR, ContextMenuContext } from './ContextMenuContextInstance'

interface ContextMenuItem {
  // Define the structure of your menu items
  label?: string
  command?: () => void
  items?: ContextMenuItem[]
  [key: string]: any
}

export interface ContextMenuContextType {
  openContext: (event: React.MouseEvent, model: ContextMenuItem[]) => void
  closeContext: () => void
  clearContextTarget: () => void
  ref: RefObject<any>
  model: ContextMenuItem[]
  isContextOpen: boolean
  setIsContextOpen: React.Dispatch<React.SetStateAction<boolean>>
}

interface ContextMenuProviderProps {
  children: ReactNode
}

function ContextMenuProvider({ children }: ContextMenuProviderProps) {
  const [isContextOpen, setIsContextOpen] = useState<boolean>(false)

  const ref = useRef<any>(null)
  const [model, setModel] = useState<ContextMenuItem[]>([])
  // the element that was right-clicked, kept looking hovered while the menu is open
  const targetRef = useRef<HTMLElement | null>(null)

  function clearContextTarget() {
    targetRef.current?.removeAttribute(CONTEXT_MENU_TARGET_ATTR)
    targetRef.current = null
  }

  function openContext(event: React.MouseEvent, model: ContextMenuItem[]) {
    if (!event || !ref.current || !model?.length) return
    event.preventDefault()
    clearContextTarget()
    const target = event.currentTarget
    if (target instanceof HTMLElement) {
      target.setAttribute(CONTEXT_MENU_TARGET_ATTR, '')
      targetRef.current = target
    }
    setModel(model)
    ref.current.show(event)
  }

  function closeContext() {
    if (!ref.current) return
    ref.current.hide()
  }

  return (
    <ContextMenuContext.Provider
      value={{
        openContext,
        closeContext,
        clearContextTarget,
        ref,
        model,
        isContextOpen,
        setIsContextOpen,
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  )
}

export { ContextMenuProvider }
