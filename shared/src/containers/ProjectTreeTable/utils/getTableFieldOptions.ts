import { BuiltInFieldOptions } from '../types'
import { FolderType, Status, Tag, TaskType } from '../types/project'

type Params = {
  users: {
    name: string
    fullName?: string
  }[]
  statuses: Status[]
  folderTypes: FolderType[]
  taskTypes: TaskType[]
  tags: Tag[]
}

export const getTableFieldOptions = ({
  users,
  statuses,
  folderTypes,
  taskTypes,
  tags,
}: Params): BuiltInFieldOptions => ({
  assignees: users.map(({ name, fullName }) => ({
    value: name,
    label: fullName || name,
    icon: `/api/users/${name}/avatar`,
  })),
  statuses: statuses
    .filter((status) => !status.scope || ['folder', 'task'].some((s) => status.scope?.includes(s)))
    .map(({ name, color, icon, scope }) => ({
      value: name,
      label: name,
      color,
      icon,
      scope,
    })),
  tags: tags.map(({ name, color }) => ({ value: name, label: name, color })),
  folderTypes: folderTypes.map(({ name, icon }) => ({ value: name, label: name, icon })),
  taskTypes: taskTypes.map(({ name, icon }) => ({ value: name, label: name, icon })),
})
