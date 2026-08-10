import { FC, MouseEventHandler, useContext } from 'react'
import clsx from 'clsx'
import styled from 'styled-components'
import { CellValue } from './CellWidget'
import { EntityIcon } from '@shared/components/EntityIcon'
import { DetailsPanelEntityContext } from '../context/DetailsPanelEntityContext'
import { useOptionalSelectedRowsContext } from '../context/SelectedRowsContext'
import { StyledBaseTextWidget } from './TextWidget'
import { READ_ONLY } from '../utils'

const EntityCell = styled(StyledBaseTextWidget)`
  position: absolute;
  inset: 0;
  padding: 4px 8px;
  align-items: center;

  &.loading {
    inset: 4px;
    border-radius: 4px;
    opacity: 1;
  }
`

export const ENTITY_WIDGET_CLASS = 'entity-widget'

type EntityWidgetProps = {
  rowId: string
  columnId: string
  value: CellValue
  entityId?: string | null
  entityType: 'folder' | 'task' | 'version'
  subType?: string | null
  className?: string
  isLoading?: boolean
}

export const EntityWidget: FC<EntityWidgetProps> = ({
  rowId,
  columnId,
  value,
  entityId,
  entityType,
  subType,
  className,
  isLoading,
}) => {
  const entityContext = useContext(DetailsPanelEntityContext)
  const selectedRowsContext = useOptionalSelectedRowsContext()

  const handleMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0 || event.detail !== 2 || !entityId || !entityContext) {
      return
    }

    selectedRowsContext?.clearRowsSelection()
    entityContext.setSelectedEntity({ entityId, entityType })
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <EntityCell
      id={`${rowId}-${columnId}`}
      className={clsx(ENTITY_WIDGET_CLASS, READ_ONLY, className, { loading: isLoading })}
      onMouseDown={handleMouseDown}
      data-tooltip-delay={200}
    >
      {subType && <EntityIcon entity={{ entityType, subType }} />}
      {String(value ?? '')}
    </EntityCell>
  )
}
