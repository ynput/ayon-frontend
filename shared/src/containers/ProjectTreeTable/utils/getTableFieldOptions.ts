import { productTypes } from '@shared/util'
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
  scopes: string[]
}

export const getTableFieldOptions = ({
  users,
  statuses,
  folderTypes,
  taskTypes,
  tags,
  scopes,
}: Params): BuiltInFieldOptions => ({
  assignee: users.map(({ name, fullName }) => ({
    value: name,
    label: fullName || name,
    icon: `/api/users/${name}/avatar`,
  })),
  status: statuses
    .filter((status) => !status.scope || scopes.some((s) => status.scope?.includes(s)))
    .map(({ name, color, icon, scope }) => ({
      value: name,
      label: name,
      color,
      icon,
      scope,
    })),
  tag: tags.map(({ name, color }) => ({ value: name, label: name, color })),
  folderType: folderTypes.map(({ name, icon }) => ({ value: name, label: name, icon })),
  taskType: taskTypes.map(({ name, icon }) => ({ value: name, label: name, icon })),
  productType: Object.entries(productTypes).map(([key, value]) => ({
    value: key,
    label: value.name,
    icon: value.icon,
  })),
})
