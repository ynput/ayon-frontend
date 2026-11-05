import { useEffect } from 'react'
import { ContextMenu } from 'primereact-context/contextmenu'
import { useContextMenu } from './context/context-menu'

export const GlobalContextMenu = () => {
  const { model, ref, isContextOpen, setIsContextOpen, clearContextTarget } = useContextMenu()

  // the menu doesn't close on Escape by itself
  useEffect(() => {
    if (!isContextOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      ref.current?.hide()
    }
    // capture, so tables and dialogs underneath don't also act on this Escape
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [isContextOpen, ref])

  return (
    <ContextMenu
      model={model}
      ref={ref}
      onShow={() => setIsContextOpen(true)}
      onHide={() => {
        setIsContextOpen(false)
        clearContextTarget()
      }}
    />
  )
}
