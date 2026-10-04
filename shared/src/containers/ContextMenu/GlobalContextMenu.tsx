import { ContextMenu } from 'primereact-context/contextmenu'
import { useContextMenu } from './ContextMenuContextInstance'

export const GlobalContextMenu = () => {
  const { model, ref, setIsContextOpen } = useContextMenu()

  return (
    <ContextMenu
      model={model}
      ref={ref}
      onShow={() => setIsContextOpen(true)}
      onHide={() => setIsContextOpen(false)}
    />
  )
}
