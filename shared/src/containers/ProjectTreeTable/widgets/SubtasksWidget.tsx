import { Chips, ChipValue, DoneCheckbox, SubtasksManagerWrapper } from '@shared/components'
import { CellEditingDialog } from '@shared/components/LinksManager/CellEditingDialog'
import { FC, useState } from 'react'
import { EDIT_TRIGGER_CLASS, WidgetBaseProps } from './CellWidget'
import { Container } from '@shared/components/LinksManager/LinksManager.styled'
import { type SubTaskNode } from '@shared/api'
import { useProjectTableContext } from '../context/ProjectTableContext'

export type SubtasksWidgetData = {
  taskId: string
  subtasks: SubTaskNode[]
}

export interface SubtasksWidgetProps extends WidgetBaseProps {
  value?: SubtasksWidgetData
  projectName: string
  cellId: string
  disabled?: boolean
}

export const SubtasksWidget: FC<SubtasksWidgetProps> = ({
  value,
  isEditing,
  cellId,
  projectName,
  disabled,
  onChange: _onChange,
  onCancelEdit,
}) => {
  const { SubtasksManager } = useProjectTableContext()
  const [selectedSubtaskIds, setSelectedSubtaskIds] = useState<string[]>([])

  const subtasks = value?.subtasks || []

  // Create chip values from subtasks
  const chipValues: ChipValue[] = subtasks.map((subtask) => ({
    label: subtask.label || subtask.name,
    tooltip: subtask.description || subtask.label || subtask.name,
    prefix: <DoneCheckbox checked={subtask.isDone} isReadOnly style={{ fontSize: 20 }} />,
  }))

  return (
    <>
      <Chips
        values={chipValues}
        pt={{ chip: { className: EDIT_TRIGGER_CLASS } }}
        disabled={disabled}
      />
      {isEditing && value && SubtasksManager && (
        <CellEditingDialog isEditing={isEditing} anchorId={cellId} onClose={onCancelEdit}>
          {disabled ? (
            <Container style={{ color: 'var(--md-sys-color-outline)' }}>
              Subtasks are disabled for this task
            </Container>
          ) : (
            <SubtasksManagerWrapper
              projectName={projectName}
              taskId={value.taskId}
              subtasks={subtasks}
              selectedSubtaskIds={selectedSubtaskIds}
              onSelectSubtasks={setSelectedSubtaskIds}
              onClose={onCancelEdit}
              SubtasksManager={SubtasksManager}
              style={{
                padding: 'var(--padding-m)',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                borderRadius: 'var(--border-radius-l)',
              }}
            />
          )}
        </CellEditingDialog>
      )}
    </>
  )
}
