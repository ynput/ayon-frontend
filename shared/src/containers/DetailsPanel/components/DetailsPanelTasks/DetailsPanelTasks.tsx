// The tasks of the selected folders: type, name, assignees and status, as in Overview. A task opens
// in the slide-out.
import { Icon, StatusField, UserImagesStacked } from '@ynput/ayon-react-components'
import type { Status } from '@ynput/ayon-react-components'
import { useMemo } from 'react'

import { useGetTasksListQuery } from '@shared/api'
import type { DetailsPanelEntityData, ProjectModel } from '@shared/api'
import { useDetailsPanelContext } from '@shared/context'

import * as Styled from './DetailsPanelTasks.styled'

type User = { avatarUrl?: string; name: string; fullName?: string }

interface DetailsPanelTasksProps {
  projectName: string
  folders: DetailsPanelEntityData[]
  projectInfo?: Partial<ProjectModel>
  users?: User[]
}

export const DetailsPanelTasks = ({
  projectName,
  folders,
  projectInfo,
  users = [],
}: DetailsPanelTasksProps) => {
  const { openSlideOut } = useDetailsPanelContext()
  const folderIds = useMemo(() => folders.map((folder) => folder.id).filter(Boolean), [folders])

  const { data, isFetching } = useGetTasksListQuery(
    { projectName, folderIds, includeFolderChildren: false, first: 500 },
    { skip: !projectName || !folderIds.length },
  )
  const tasks = data?.tasks ?? []

  const taskTypes = useMemo(
    () => new Map((projectInfo?.taskTypes ?? []).map((type) => [type.name, type])),
    [projectInfo],
  )
  const statuses = useMemo(
    () => new Map((projectInfo?.statuses ?? []).map((status) => [status.name, status])),
    [projectInfo],
  )
  const usersByName = useMemo(() => new Map(users.map((user) => [user.name, user])), [users])
  const folderNames = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder.label || folder.name])),
    [folders],
  )

  if (!tasks.length)
    return (
      <Styled.Empty>{isFetching || !folderIds.length ? 'Loading tasks…' : 'No tasks'}</Styled.Empty>
    )

  return (
    <Styled.List className={isFetching ? 'loading' : undefined}>
      {tasks.map((task) => {
        const type = taskTypes.get(task.taskType)
        const status = statuses.get(task.status)
        const assignees = (task.assignees ?? []).map(
          (name) =>
            usersByName.get(name) ?? {
              name,
              avatarUrl: `/api/users/${encodeURIComponent(name)}/avatar`,
            },
        )
        return (
          <Styled.Row
            key={task.id}
            onClick={() => openSlideOut({ entityId: task.id, entityType: 'task', projectName })}
            data-testid="details-panel-task"
          >
            <Icon icon={type?.icon || 'task_alt'} style={{ color: type?.color || undefined }} />
            <span className="name">
              {task.label || task.name}
              {folderIds.length > 1 && (
                <span className="folder">{folderNames.get(task.folderId)}</span>
              )}
            </span>
            <span className="assignees">
              {!!assignees.length && (
                <UserImagesStacked
                  users={assignees}
                  size={20}
                  max={3}
                  data-tooltip={assignees.map((user) => user.fullName || user.name).join(', ')}
                />
              )}
            </span>
            {status ? (
              <StatusField
                status={status as Status}
                size="short"
                invert
                data-tooltip={status.name}
                className="status"
              />
            ) : (
              <span />
            )}
          </Styled.Row>
        )
      })}
    </Styled.List>
  )
}
