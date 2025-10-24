/**
 * Constants and utilities for handling restricted entities (entities the user doesn't have access to)
 */

export const RESTRICTED_ENTITY_TYPE = 'unknown' as const
export const RESTRICTED_ENTITY_NAME = 'restricted'
export const RESTRICTED_ENTITY_LABEL = 'Access Restricted - Insufficient Permissions'
export const RESTRICTED_ENTITY_ICON = 'lock'

/**
 * Check if an entity type indicates restricted access
 * @param type - The entity type to check
 * @returns true if the entity is restricted (no access), false otherwise
 */
export const isEntityRestricted = (type: string | undefined): boolean =>
  type === RESTRICTED_ENTITY_TYPE
