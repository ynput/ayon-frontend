import { createContext, useContext } from 'react'

/**
 * How deep the nearest enclosing settings group sits in the flat layout.
 * 0 is the sheet (the form root), 1 is a card, anything deeper is a
 * sub-group drawn inside its card.
 */
export const SettingsGroupDepthContext = createContext(0)

export const useSettingsGroupDepth = () => useContext(SettingsGroupDepthContext)
