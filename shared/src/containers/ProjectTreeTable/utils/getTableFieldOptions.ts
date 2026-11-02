import type { ProductType } from '@shared/api'
import { labelCollator } from '@shared/util/sortLists'
import type { BuiltInFieldOptions } from '../types'
import type { FolderType, Status, Tag, TaskType } from '../types/project'

type Params = {
  users: {
    name: string
    fullName?: string | null
    hidden?: boolean
  }[]
  statuses: Status[]
  folderTypes: FolderType[]
  taskTypes: TaskType[]
  productTypes: ProductType[]
  tags: Tag[]
  scopes: string[]
}

export const getTableFieldOptions = ({
  users,
  statuses,
  folderTypes,
  taskTypes,
  productTypes,
  tags,
  scopes,
}: Params): BuiltInFieldOptions => {
  const getStatusOptions = (allowedScopes: string[]) =>
    statuses
      .filter(
        (status) => !status.scope || allowedScopes.some((scope) => status.scope?.includes(scope)),
      )
      .map(({ name, color, icon, scope }) => ({
        value: name,
        label: name,
        color,
        icon,
        scope,
      }))

  return {
    // sorted by the label the dropdown shows, not the username
    assignee: users
      .map(({ name, fullName, hidden }) => ({
        value: name,
        label: fullName?.trim() || name,
        icon: `/api/users/${name}/avatar`,
        hidden,
      }))
      .sort((a, b) => labelCollator.compare(a.label, b.label)),
    status: getStatusOptions(scopes),
    folderStatus: getStatusOptions(['folder']),
    taskStatus: getStatusOptions(['task']),
    tag: tags.map(({ name, color }) => ({ value: name, label: name, color })),
    folderType: folderTypes.map(({ name, icon, color }) => ({
      value: name,
      label: name,
      icon,
      color,
    })),
    taskType: taskTypes.map(({ name, icon, color }) => ({ value: name, label: name, icon, color })),
    productType: productTypes.map(({ name, icon, color }) => ({
      value: name,
      label: name,
      icon,
      color,
    })),
  }
}
