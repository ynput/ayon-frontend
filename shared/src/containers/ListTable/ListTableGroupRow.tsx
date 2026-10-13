import React from 'react'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './ListTable.styled'
import clsx from 'clsx'
import {
  defaultGroupLabel,
  isGroupDisplayValue,
  parseInternalGroupingColumnId,
} from './ListTableGroupRowHelpers'

// --- Group row component ---

interface GroupRowProps {
  groupColumnId: string
  groupValue: unknown
  count: number
  countLabel?: string
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
  countLabel,
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
      className={clsx('group-row', { expanded: isExpanded })}
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
          <Styled.GroupCount>
            {count}
            {countLabel ? ` ${countLabel}` : ''}
          </Styled.GroupCount>
        </Styled.GroupRowContent>
      </Styled.GroupTD>
    </Styled.TR>
  )
}
