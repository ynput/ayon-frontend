import React from 'react'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './ListTable.styled'
import type { ListTableGroupDisplay } from './ListTable.types'

export const INTERNAL_GROUPING_COLUMN_PREFIX = '__group_path__'

export const parseInternalGroupingColumnId = (columnId: string) => {
  if (!columnId.startsWith(INTERNAL_GROUPING_COLUMN_PREFIX)) return null
  const trimmed = columnId.slice(INTERNAL_GROUPING_COLUMN_PREFIX.length)
  const separatorIndex = trimmed.lastIndexOf('__')
  if (separatorIndex === -1) return null
  const baseColumnId = trimmed.slice(0, separatorIndex)
  const level = Number(trimmed.slice(separatorIndex + 2))
  return Number.isNaN(level) ? null : { baseColumnId, level }
}

export const isGroupDisplayValue = (value: unknown): value is ListTableGroupDisplay =>
  !!value &&
  typeof value === 'object' &&
  ('label' in (value as object) || 'value' in (value as object))

export const isCustomGroupRowValue = (
  value: unknown,
): value is {
  __listTableGroup: true
  __groupColumnId: string
  __groupValue: unknown
} => !!value && typeof value === 'object' && '__listTableGroup' in (value as object)

/** Format a raw group column value into a human-readable label. */
export function defaultGroupLabel(columnId: string, value: unknown): string {
  if (value === null || value === undefined) return '(None)'
  if (typeof value === 'boolean') {
    // Common boolean column label mappings
    if (columnId === 'active') return value ? 'Active' : 'Inactive'
    if (columnId === 'library') return value ? 'Library' : 'Standard'
    return value ? 'Yes' : 'No'
  }
  return String(value)
}

// --- Group row component ---

interface GroupRowProps {
  groupColumnId: string
  groupValue: unknown
  count: number
  depth: number
  isExpanded: boolean
  onToggle: () => void
  virtualStart: number
  onContextMenu?: React.MouseEventHandler<HTMLTableRowElement>
}

export function GroupRow({
  groupColumnId,
  groupValue,
  count,
  depth,
  isExpanded,
  onToggle,
  virtualStart,
  onContextMenu,
}: GroupRowProps) {
  const parsedColumnId = parseInternalGroupingColumnId(groupColumnId)
  const resolvedColumnId = parsedColumnId?.baseColumnId ?? groupColumnId
  const displayFromValue = isGroupDisplayValue(groupValue) ? groupValue : undefined
  const resolvedValue = displayFromValue?.value ?? groupValue
  const label = displayFromValue?.label ?? defaultGroupLabel(resolvedColumnId, resolvedValue)

  return (
    <Styled.TR
      style={{
        transform: `translateY(${virtualStart}px)`,
        paddingLeft: depth * 16,
      }}
      onClick={onToggle}
      onContextMenu={onContextMenu}
      className="group-row"
    >
      <Styled.GroupTD>
        <Styled.GroupRowContent>
          <Styled.Expander
            className="expander"
            icon={isExpanded ? 'expand_more' : 'chevron_right'}
            variant="text"
          />
          {displayFromValue?.icon ? (
            <Icon
              icon={displayFromValue.icon as any}
              style={{ color: displayFromValue.color }}
              filled
            />
          ) : displayFromValue?.color ? (
            <Styled.GroupColorDot style={{ backgroundColor: displayFromValue.color }} />
          ) : null}
          <span>{label}</span>
          <Styled.GroupCount>{count}</Styled.GroupCount>
        </Styled.GroupRowContent>
      </Styled.GroupTD>
    </Styled.TR>
  )
}
