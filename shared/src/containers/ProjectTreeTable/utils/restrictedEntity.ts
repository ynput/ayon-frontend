/**
 * Constants and utilities for handling restricted entities (entities the user doesn't have access to)
 */

import { MouseEvent } from 'react'

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

export const READ_ONLY = 'readonly'
export const isTargetReadOnly = (e: MouseEvent<HTMLTableCellElement>): boolean => {
  const target = e.target as HTMLElement
  // if target is td, look at at child classes
  if (target.tagName === 'TD') {
    return (
      target.classList.contains(READ_ONLY) ||
      Array.from(target.children).some((child) => child.classList.contains(READ_ONLY))
    )
  } else {
    // look up for parent classes
    return target.closest(`.${READ_ONLY}`) !== null
  }
}
