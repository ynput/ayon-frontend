import { FC, MouseEventHandler, useContext } from 'react'
import clsx from 'clsx'
import styled from 'styled-components'
import { CellValue } from './CellWidget'
import { EntityIcon } from '@shared/components/EntityIcon'
import { DetailsPanelEntityContext } from '../context/DetailsPanelEntityContext'
import { useOptionalSelectedRowsContext } from '../context/SelectedRowsContext'
import { StyledBaseTextWidget } from './TextWidget'
import { READ_ONLY } from '../utils'
import { Icon } from '@ynput/ayon-react-components'

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

const EntityButton = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  border-radius: 4px;
  cursor: pointer;
  padding: 2px 4px;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }
`

const OpenIcon = styled(Icon)`
  opacity: 0;

  ${EntityButton}:hover & {
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

  const openEntity = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !entityId || !entityContext) {
      return
    }

    selectedRowsContext?.clearRowsSelection()
    entityContext.setSelectedEntity({ entityId, entityType })
    event.preventDefault()
  }

  const handleMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.detail === 2) openEntity(event)
  }

  return (
    <EntityCell
      id={`${rowId}-${columnId}`}
      className={clsx(ENTITY_WIDGET_CLASS, READ_ONLY, className, { loading: isLoading })}
      onMouseDown={handleMouseDown}
      data-tooltip-delay={200}
    >
      <EntityButton onMouseDown={openEntity}>
        {subType && <EntityIcon entity={{ entityType, subType }} />}
        {String(value ?? '')}
        <OpenIcon icon="dock_to_left" />
      </EntityButton>
    </EntityCell>
  )
}
