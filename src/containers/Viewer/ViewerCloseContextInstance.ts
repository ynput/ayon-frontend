import { createContext } from 'react'

// Closes the viewer, for its details panel: beside the player that panel is a player plugin,
// which only gets the player's props.
export const ViewerCloseContext = createContext<(() => void) | undefined>(undefined)
