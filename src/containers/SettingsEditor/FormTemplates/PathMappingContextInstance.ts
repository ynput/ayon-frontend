import { createContext, useContext } from 'react'
import type { PathMappingData } from './PathMappingHelpers'

/**
 * Set by SettingsObjectField around a directory mapping object (flat layout only): the
 * object's id and a write for the whole object, so a pair changes both lists at once.
 */
export type PathMappingState = {
  objectId: string
  onChange: (data: PathMappingData) => void
}

export const PathMappingContext = createContext<PathMappingState | null>(null)

export const usePathMapping = () => useContext(PathMappingContext)
