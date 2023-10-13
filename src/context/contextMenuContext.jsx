import React, { createContext, useContext, useRef, useState } from 'react'

const ContextMenuContext = createContext()

function ContextMenuProvider(props) {
  const [isContextOpen, setIsContextOpen] = useState(false)

  const ref = useRef(null)
  const [model, setModel] = useState([])

  function openContext(event, model) {
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
      {props.children}
    </ContextMenuContext.Provider>
  )
}

function useContextMenu() {
  return useContext(ContextMenuContext)
}

export { ContextMenuProvider, useContextMenu }
