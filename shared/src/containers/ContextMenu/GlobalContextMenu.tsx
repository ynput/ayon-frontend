import { useEffect } from 'react'
import { ContextMenu } from 'primereact-context/contextmenu'
import { useContextMenu } from './context/context-menu'

export const GlobalContextMenu = () => {
  const { model, ref, isContextOpen, setIsContextOpen } = useContextMenu()

  // PrimeReact only hides on a document click, and the browser fires no click when the
  // pressed element is re-rendered away before mouseup (e.g. selecting a table cell)
  useEffect(() => {
    if (!isContextOpen) return

    const handlePointerDown = (e: PointerEvent) => {
      const menuEl: HTMLElement | null | undefined = ref.current?.getElement()
      if (menuEl?.contains(e.target as Node)) return
      ref.current?.hide(e)
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [isContextOpen, ref])

  return (
    <ContextMenu
      model={model}
      ref={ref}
      onShow={() => setIsContextOpen(true)}
      onHide={() => setIsContextOpen(false)}
    />
  )
}
