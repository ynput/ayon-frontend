/**
 * Shared cell utilities for table operations
 */

import { TaskLink } from '@shared/api'
import { parseRowId } from '../context'
import {
  EMapResult,
  EntitiesMap,
  EntityScope,
  EntityType,
  getScopedValue,
  TableRow,
} from '../types'

// Type definitions for cell identifiers
export type CellId = string
export type RowId = string
export type ColId = string

// Cell position in the grid
export interface CellPosition {
  rowId: RowId
  colId: ColId
}

export type ScopedColumn = {
  scope: EntityScope
  field: string
  isAttrib: boolean
}

// Cell border position flags - used for determining which borders to show
export enum BorderPosition {
  None = 0,
  Top = 1 << 0,
  Right = 1 << 1,
  Bottom = 1 << 2,
  Left = 1 << 3,
  All = Top | Right | Bottom | Left,
}

/**
 * Create a standardized cell ID from row and column IDs
 */
export const getCellId = (rowId: RowId, colId: ColId): CellId => `cell-${rowId}-${colId}`

/**
 * Parse a cell ID to extract row and column IDs
 * @returns CellPosition or null if invalid format
 */
export const parseCellId = (cellId: CellId): CellPosition | null => {
  const match = cellId.match(/^cell-(.+)-(.+)$/)
  if (!match) return null
  return { rowId: match[1], colId: match[2] }
}

const ENTITY_SCOPES = new Set<EntityType>(['folder', 'task', 'product', 'version'])

export const getScopedColumnId = (scope: EntityScope, field: string, isAttrib = false): ColId => {
  const scopedField = isAttrib ? `attrib_${field}` : field
  return scope === 'primary' ? scopedField : `${scope}_${scopedField}`
}

export const parseScopedColumnId = (columnId: ColId): ScopedColumn => {
  const [prefix, ...rest] = columnId.split('_')
  const scope =
    ENTITY_SCOPES.has(prefix as EntityType) && rest.length > 0 ? (prefix as EntityType) : 'primary'
  const scopedField = (scope === 'primary' ? [prefix, ...rest] : rest).join('_')
  const isAttrib = scopedField.startsWith('attrib_')

  return {
    scope,
    field: isAttrib ? scopedField.slice('attrib_'.length) : scopedField,
    isAttrib,
  }
}

const isTableRow = (value: unknown): value is TableRow =>
  !!value && typeof value === 'object' && 'primary' in value

export const getCellValue = (obj: any, path: string): any => {
  if (!obj || !path) return undefined

  if (isTableRow(obj)) {
    const { scope, field, isAttrib } = parseScopedColumnId(path)
    return getScopedValue(obj, scope, field, isAttrib)
  }

  const parts = path.split('_')
  let current = obj

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      return undefined // Return undefined if any part of the path is invalid
    }
  }

  return current
}

// return the link entity ids for a given column id
export const getLinkEntityIdsByColumnId = (links: TaskLink[], columnId: CellId): string => {
  // split the columnId
  const [_link, linkType, _inType, _outType, direction] = columnId.split('_')
  const cellLinks = links.filter(
    (link) => link.linkType === linkType && link.direction === direction,
  )
  if (cellLinks.length) {
    return cellLinks.map((link) => link.node.id).join(',')
  } else {
    return ''
  }
}

/**
 * Determines which borders to display for a selected cell
 * based on its position within the selection grid
 *
 * @param rowIndex Current cell's row index
 * @param colIndex Current cell's column index
 * @param selectedCells 2D array representing selection state (true = selected)
 * @returns BorderPosition flags indicating which borders to display
 */
export const getCellBorders = (
  rowIndex: number,
  colIndex: number,
  selectedCells: boolean[][],
): BorderPosition => {
  if (!selectedCells[rowIndex]?.[colIndex]) {
    return BorderPosition.None
  }

  let borders = BorderPosition.None

  // Check top border
  if (rowIndex === 0 || !selectedCells[rowIndex - 1]?.[colIndex]) {
    borders |= BorderPosition.Top
  }

  // Check right border
  if (!selectedCells[rowIndex]?.[colIndex + 1]) {
    borders |= BorderPosition.Right
  }

  // Check bottom border
  if (!selectedCells[rowIndex + 1]?.[colIndex]) {
    borders |= BorderPosition.Bottom
  }

  // Check left border
  if (colIndex === 0 || !selectedCells[rowIndex]?.[colIndex - 1]) {
    borders |= BorderPosition.Left
  }

  return borders
}

/**
 * Converts border position flags to CSS classes for shadow styling
 */
export const getBorderClasses = (borders: BorderPosition): string[] => {
  const classes: string[] = []

  if (borders & BorderPosition.Top) classes.push('shadow-top')
  if (borders & BorderPosition.Right) classes.push('shadow-right')
  if (borders & BorderPosition.Bottom) classes.push('shadow-bottom')
  if (borders & BorderPosition.Left) classes.push('shadow-left')

  return classes
}

// get a entity from it's id
export const getEntityDataById = <T extends 'folder' | 'task' | 'product' | 'version'>(
  id: string,
  entitiesMap: EntitiesMap,
) => entitiesMap.get(parseRowId(id)) as EMapResult<T> | undefined
