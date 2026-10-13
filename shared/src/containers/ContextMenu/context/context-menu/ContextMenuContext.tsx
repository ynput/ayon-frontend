import React, { useRef, useState, ReactNode, RefObject } from 'react'
import { ContextMenuContext } from './ContextMenuContextInstance'

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

  function openContext(event: React.MouseEvent, model: ContextMenuItem[]) {
    if (!event || !ref.current || !model?.length) return
    event.preventDefault()
    setModel(model)
    ref.current.show(event)
  }

  function closeContext() {
    if (!ref.current) return
    ref.current.hide()
  }

  return (
    <ContextMenuContext.Provider
      value={{ openContext, closeContext, ref, model, isContextOpen, setIsContextOpen }}
    >
      {children}
    </ContextMenuContext.Provider>
  )
}

export { ContextMenuProvider }
