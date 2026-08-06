import { FC, MouseEventHandler, useContext } from 'react'
import clsx from 'clsx'
import { CellWidget, CellValue } from './CellWidget'
import { EntityIcon } from '@shared/components/EntityIcon'
import { DetailsPanelEntityContext } from '../context/DetailsPanelEntityContext'
import { useOptionalSelectedRowsContext } from '../context/SelectedRowsContext'
import { isEntityRestricted } from '../utils/restrictedEntity'

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
    if (
      event.button !== 0 ||
      event.detail !== 2 ||
      !entityId ||
      isEntityRestricted(entityType) ||
      !entityContext
    ) {
      return
    }

    selectedRowsContext?.clearRowsSelection()
    entityContext.setSelectedEntity({ entityId, entityType })
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <CellWidget
      rowId={rowId}
      columnId={columnId}
      value={value}
      attributeData={{ type: 'string' }}
      startAdornment={
        subType ? (
          <EntityIcon entity={{ entityType, subType }} style={{ marginRight: 4 }} />
        ) : undefined
      }
      className={clsx('entity-widget', className, { loading: isLoading })}
      onMouseDown={handleMouseDown}
    />
  )
}
