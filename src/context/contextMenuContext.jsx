import React, { createContext, useContext, useState } from 'react'

const ContextMenuContext = createContext()

function ContextMenuProvider(props) {
  const [openRef, setOpenRef] = useState(null)

  function openContext(event, ref) {
    if (!ref.current) return console.error('No ref passed to openContext')
    if (!event) return console.error('No event passed to openContext')

    if (openRef && openRef.current && openRef.current !== ref.current) {
      openRef.current.hide()
    }
    setOpenRef(ref)
    ref.current.show(event)
  }

  function handleClose() {
    if (openRef && openRef.current) {
      openRef.current.hide()
    }
    setOpenRef(null)
  }

  return (
    <ContextMenuContext.Provider value={{ openRef, openContext, handleClose }}>
      {props.children}
    </ContextMenuContext.Provider>
  )
}

function useContextMenu() {
  return useContext(ContextMenuContext)
}

export { ContextMenuProvider, useContextMenu }
