import { createContext } from 'react'
import { EntityUpdatesContextValue } from './EntityUpdatesContext'

export const EntityUpdatesContext = createContext<EntityUpdatesContextValue | undefined>(undefined)
