import { ContextMenu } from 'primereact-context/contextmenu'
import React from 'react'
import { useContextMenu } from '@context/contextMenuContext'

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
