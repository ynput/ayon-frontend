import { ProjectModel, Status } from '@api/rest/project'
import { TableRow } from '../types'
import { Assignees } from '@queries/user/getUsers'

import { UserImage as UserImageArc, UserImageProps } from '@ynput/ayon-react-components'

interface UserImageCustomProps extends UserImageProps {
  name: string
  fullName: string
  imageKey?: string
}
// wraps the ARC UserImage component to use new user image api
const UserImage = ({ name, fullName, imageKey, ...props }: UserImageCustomProps) => {
  if (!name) return <UserImageArc name="n/a" {...props} />
  return (
    <UserImageArc
      name={name}
      fullName={fullName}
      src={`/api/users/${name}/avatar?key=${imageKey || ''}`}
      {...props}
    />
  )
}

export type UseExtraSlicesProps = {}

const useExtraSlices = ({}: UseExtraSlicesProps = {}) => {
  //   Status
  const formatStatuses = async (projectAnatomy?: ProjectModel) => {
    const statuses = projectAnatomy?.statuses as Status[] | undefined
    if (!statuses) return []

    // create table rows
    const statusTableRows: TableRow[] = statuses.map((status) => ({
      id: status.name,
      name: status.name,
      label: status.name,
      icon: typeof status.icon === 'string' ? status.icon : undefined,
      iconColor: status.color,
      subRows: [],
      data: {
        id: status.name,
        name: status.name,
        label: status.name,
      },
    }))

    return statusTableRows
  }

  //   merges folder types and tasks types into one table, but each type has a parent for folder or task
  const formatTypes = async (projectAnatomy?: ProjectModel) => {
    const folderTypes = projectAnatomy?.folderTypes || []
    const taskTypes = projectAnatomy?.taskTypes || []

    // create table rows
    const folderTypeTableRows: TableRow[] = folderTypes.map((folderType) => ({
      id: folderType.name,
      parentId: 'folder',
      name: folderType.name,
      label: folderType.name,
      icon: folderType.icon,
      subRows: [],
      data: {
        id: folderType.name,
        name: folderType.name,
        label: folderType.name,
        subType: 'folder',
      },
    }))

    const taskTypeTableRows: TableRow[] = taskTypes.map((taskType) => ({
      id: taskType.name,
      parentId: 'task',
      name: taskType.name,
      label: taskType.name,
      icon: taskType.icon,
      subRows: [],
      data: {
        id: taskType.name,
        name: taskType.name,
        label: taskType.name,
        subType: 'task',
      },
    }))

    return [
      {
        id: 'folder',
        name: 'folders',
        label: 'Folder Types',
        subRows: folderTypeTableRows,
        data: { id: 'folder', name: 'folders', label: 'Folder Types' },
      },
      {
        id: 'task',
        name: 'tasks',
        label: 'Task Types',
        subRows: taskTypeTableRows,
        data: { id: 'task', name: 'tasks', label: 'Task Types' },
      },
    ]
  }

  // formats only task types
  const formatTaskTypes = async (projectAnatomy?: ProjectModel) => {
    const taskTypes = projectAnatomy?.taskTypes || []

    // create table rows
    const taskTypeTableRows: TableRow[] = taskTypes.map((taskType) => ({
      id: taskType.name,
      parentId: 'task',
      name: taskType.name,
      label: taskType.name,
      icon: taskType.icon,
      subRows: [],
      data: {
        id: taskType.name,
        name: taskType.name,
        label: taskType.name,
        subType: 'task',
      },
    }))

    return taskTypeTableRows
  }

  const formatAssignees = (assignees: Assignees) => {
    // transform data into table rows
    const userTableRows: TableRow[] = assignees.map((user) => ({
      id: user.name,
      name: user.name,
      label: user.fullName || user.name,
      startContent: (
        <UserImage
          name={user.name}
          fullName={user.fullName || user.name}
          imageKey={user.updatedAt}
          size={20}
          style={{ minWidth: 20 }}
        />
      ),
      subRows: [],
      data: {
        id: user.name,
        name: user.name,
        label: user.fullName,
      },
    }))

    const sortedRows = userTableRows.sort((a, b) => a.label.localeCompare(b.label))

    return sortedRows
  }

  return {
    formatStatuses,
    formatTypes,
    formatTaskTypes,
    formatAssignees,
  }
}

export default useExtraSlices
