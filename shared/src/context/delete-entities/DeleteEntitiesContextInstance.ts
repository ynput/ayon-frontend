import { createContext, useContext } from 'react'
import type { DeletableEntityType, DeleteEntitiesContextValue } from './DeleteEntitiesContext'

const DELETABLE_ENTITY_TYPES = new Set<string>([
  'folder',
  'task',
  'product',
  'version',
  'representation',
  'workfile',
])

export const isDeletableEntityType = (type?: string): type is DeletableEntityType =>
  !!type && DELETABLE_ENTITY_TYPES.has(type)

export const DeleteEntitiesContext = createContext<DeleteEntitiesContextValue | null>(null)

export const useDeleteEntitiesContext = (): DeleteEntitiesContextValue => {
  const ctx = useContext(DeleteEntitiesContext)
  if (!ctx) {
    throw new Error('useDeleteEntitiesContext must be used within a DeleteEntitiesProvider')
  }
  return ctx
}

// non-throwing variant for optional consumers (e.g. menus that may render outside the provider)
export const useDeleteEntitiesContextOptional = (): DeleteEntitiesContextValue | null =>
  useContext(DeleteEntitiesContext)
