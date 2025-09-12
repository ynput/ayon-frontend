import {Chips, ChipValue, LinkEntity, LinksManager} from '@shared/components'
import { CellEditingDialog } from '@shared/components/LinksManager/CellEditingDialog'
import { FC } from 'react'
import { EDIT_TRIGGER_CLASS, WidgetBaseProps } from './CellWidget'
import { createPortal } from 'react-dom'
import { useDetailsPanelEntityContext } from '../context/DetailsPanelEntityContext'
import { useSelectedRowsContext } from '../context/SelectedRowsContext'
import {Container} from "@shared/components/LinksManager/LinksManager.styled";

export const isLinkEditable = (
  direction: 'in' | 'out',
  linkType: string,
  entityType: string,
): boolean => {
  const linkTypeParts = linkType.split('|')
  const [_name, outType, inType] = linkTypeParts
  if (direction === 'in') {
    return entityType === inType
  } else {
    return entityType === outType
  }
}

export type LinkWidgetData = {
  direction: 'in' | 'out'
  entityId: string
  entityType: string
  link: {
    linkType: string
    label: string
    targetEntityType: string
  }
  links: LinkEntity[]
}

export interface LinksWidgetProps extends WidgetBaseProps {
  value?: LinkWidgetData
  projectName: string
  cellId: string
  disabled?: boolean
  folderId?: string | null // the folder selected or the parent folder of the selected (used in EntityPickerDialog)
}

export const LinksWidget: FC<LinksWidgetProps> = ({
  value,
  isEditing,
  cellId,
  projectName,
  disabled,
  folderId,
  onChange: _onChange, // not used in this widget
  onCancelEdit,
}) => {
  // Try to get the contexts, but they might not exist in all environments
  let setSelectedEntity:
    | ((entity: { entityId: string; entityType: 'folder' | 'task' }) => void)
    | undefined
  let clearRowsSelection: (() => void) | undefined

  const selectedEntityIds: string[] = []
  try {
    const entityContext = useDetailsPanelEntityContext()
    setSelectedEntity = entityContext.setSelectedEntity
    if (entityContext.selectedEntity) {
      selectedEntityIds.push(entityContext.selectedEntity.entityId)
    }
  } catch {
    // Context not available
  }

  try {
    const rowsContext = useSelectedRowsContext()
    clearRowsSelection = rowsContext.clearRowsSelection
  } catch {
    // Context not available
  }

  const handleEntityClick = (entityId: string, entityType: string) => {
    // Clear any row selection first if context is available
    if (clearRowsSelection) {
      clearRowsSelection()
    }
    // Set the selected entity if context is available
    if (setSelectedEntity) {
      setSelectedEntity({
        entityId,
        entityType: entityType as 'folder' | 'task',
      })
    } else {
      // Fallback to console.log if contexts are not available
      console.log('Entity clicked:', entityId, entityType)
    }
  }
  return (
    <>
      <Chips
        values={
          value?.links?.map((v) => ({
            label: v.label,
            tooltip: v.parents.join('/') + '/' + v.label,
          })) || []
        }
        pt={{ chip: { className: EDIT_TRIGGER_CLASS } }}
        disabled={disabled}
      />
      {isEditing &&
        value &&
        (
          <CellEditingDialog
            isEditing={isEditing}
            anchorId={cellId}
            onClose={onCancelEdit}
            disabled={disabled}
          >
            {disabled ? (
              <Container
                style={{ color: 'var(--md-sys-color-outline)' }}
              >
                {`${value.link.label || ''} ${value.direction} link is not of type ${value.entityType}`}
              </Container>
            ) : (
              <LinksManager
                projectName={projectName}
                linkTypeLabel={value.link.label || ''}
                links={value.links}
                direction={value.direction}
                entityId={value.entityId}
                entityType={value.entityType}
                targetEntityType={value.link.targetEntityType}
                linkType={value.link.linkType}
                selectedEntityIds={selectedEntityIds}
                onEntityClick={handleEntityClick}
                folderId={folderId}
                onClose={onCancelEdit}
              />
            )}
          </CellEditingDialog>
        )}
    </>
  )
}
