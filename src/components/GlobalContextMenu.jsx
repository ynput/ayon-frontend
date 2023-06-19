import { ContextMenu } from 'primereact/contextmenu'
import React from 'react'
import { useContextMenu } from '../context/contextMenuContext'

export const GlobalContextMenu = () => {
  const { model, ref } = useContextMenu()

  return <ContextMenu model={model} ref={ref} />
}
