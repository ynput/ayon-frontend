import { useState } from 'react'
import { Button, Icon } from '@ynput/ayon-react-components'

import { useGetTaskQuery } from '@shared/api'
import type { DetailsPanelEntityData } from '@shared/api'
import { useDetailsPanelContext, ProjectFoldersContextProvider } from '@shared/context'
import { EntityPickerDialog } from '@shared/containers'

import * as Styled from './LinkedTaskRow.styled'

interface LinkedTaskRowProps {
  entity: DetailsPanelEntityData
  taskTypeIcons: Record<string, string>
  taskTypeColors: Record<string, string>
  onLinkTask: (taskId: string) => void | Promise<void>
}

const LinkedTaskRow = ({
  entity,
  taskTypeIcons,
  taskTypeColors,
  onLinkTask,
}: LinkedTaskRowProps) => {
  const { openSlideOut } = useDetailsPanelContext()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [linkedTaskId, setLinkedTaskId] = useState<string>()

  const { folder, projectName } = entity
  const taskId = linkedTaskId || entity.task?.id
  // the optimistic version update leaves an empty task object; ignore it until it has real data
  const panelTask = entity.task?.name ? entity.task : undefined
  const needsFetch = !!linkedTaskId || (!!taskId && !panelTask)

  const { data: fetchedTask } = useGetTaskQuery(
    { projectName, taskId: taskId as string },
    { skip: !taskId || !needsFetch },
  )

  const task = fetchedTask ?? panelTask
  const showSkeleton = !!taskId && !task

  const handleSubmit = (selection: string[]) => {
    setPickerOpen(false)
    const newTaskId = selection[0]
    if (!newTaskId) return
    setLinkedTaskId(newTaskId)
    onLinkTask(newTaskId)
  }

  return (
    <Styled.Row className="linked-task">
      <span>Task</span>
      {task && task.id ? (
        <Styled.TaskLink
          onClick={() =>
            openSlideOut({ entityId: task.id as string, entityType: 'task', projectName })
          }
        >
          <Icon
            icon={taskTypeIcons[task.taskType] || 'task_alt'}
            style={{ color: taskTypeColors[task.taskType] }}
          />
          <span className="label">{task.label || task.name}</span>
        </Styled.TaskLink>
      ) : showSkeleton ? (
        <Styled.Skeleton className="loading" />
      ) : (
        <Button variant="text" icon="add_link" onClick={() => setPickerOpen(true)}>
          Link task
        </Button>
      )}
      {pickerOpen && (
        <ProjectFoldersContextProvider projectName={projectName}>
          <EntityPickerDialog
            onClose={() => setPickerOpen(false)}
            projectName={projectName}
            entityType="task"
            initialSelection={folder?.id ? { folder: { [folder.id]: true } } : undefined}
            onSubmit={handleSubmit}
          />
        </ProjectFoldersContextProvider>
      )}
    </Styled.Row>
  )
}

export default LinkedTaskRow
