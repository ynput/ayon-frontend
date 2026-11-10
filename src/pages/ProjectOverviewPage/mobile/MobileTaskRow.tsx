import { memo } from 'react'
import { Icon, UserImagesStacked } from '@ynput/ayon-react-components'
import { Thumbnail } from '@shared/components'
import type { EditorTaskNode } from '@shared/containers/ProjectTreeTable'
import type { TaskType } from '@shared/api'
import * as Styled from './MobileOverview.styled'
import MobileFieldValue from './MobileFieldValue'
import {
  formatFrameRange,
  formatShortDate,
  getTaskFieldValues,
  type StatusOption,
  type TaskField,
} from './MobileTaskRowHelpers'

type User = { name: string; fullName?: string }

type Props = {
  task: EditorTaskNode
  projectName: string
  taskType?: TaskType
  status?: StatusOption
  usersByName: Map<string, User>
  fields: TaskField[] | null
  hideEmpty: boolean
  indent: number
  onOpen: (taskId: string) => void
}

const MobileTaskRow = ({
  task,
  projectName,
  taskType,
  status,
  usersByName,
  fields,
  hideEmpty,
  indent,
  onOpen,
}: Props) => {
  const assignees = (task.assignees ?? []).map((name) => usersByName.get(name) ?? { name })
  const values = fields ? getTaskFieldValues(task, fields, usersByName, hideEmpty) : []
  const frameRange = fields ? undefined : formatFrameRange(task.attrib)
  const dueDate = fields ? undefined : formatShortDate(task.attrib?.endDate)

  return (
    <Styled.TaskRow type="button" $indent={indent} onClick={() => onOpen(task.id)}>
      <Styled.ThumbnailBox>
        <Thumbnail
          projectName={projectName}
          entityType="task"
          entityId={task.id}
          thumbnailHash={task.thumbnailHash ?? undefined}
          icon={taskType?.icon}
          showBorder={false}
        />
      </Styled.ThumbnailBox>
      <Styled.TaskText>
        <Styled.TaskName>
          <Icon icon={taskType?.icon || 'task_alt'} style={{ color: taskType?.color }} />
          <span>{task.label || task.name}</span>
        </Styled.TaskName>
        <Styled.TaskMeta>
          {!!assignees.length && <UserImagesStacked users={assignees} size={20} max={2} />}
          {frameRange && <span>{frameRange}</span>}
          {dueDate && <span>{dueDate}</span>}
          {values.map((value) => (
            <MobileFieldValue key={value.id} value={value} />
          ))}
        </Styled.TaskMeta>
      </Styled.TaskText>
      <Styled.StatusPill
        variant="filled"
        label={status?.name ?? task.status}
        icon={status?.icon}
        color={status?.color}
        colorLight={status?.colorLight}
      />
    </Styled.TaskRow>
  )
}

export default memo(MobileTaskRow)
