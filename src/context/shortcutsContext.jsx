import React, { createContext, useContext } from 'react'

const ShortcutsContext = createContext()

function ContextMenuProvider(props) {
  return <ShortcutsContext.Provider value={{}}>{props.children}</ShortcutsContext.Provider>
}

function useShortcutsContext() {
  return useContext(ShortcutsContext)
}

export { ContextMenuProvider, useShortcutsContext }
