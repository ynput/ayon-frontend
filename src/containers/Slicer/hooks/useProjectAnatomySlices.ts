import { useGetProjectQuery } from '@queries/project/getProject'
import { Status } from '@ynput/ayon-react-components'
import { TableRow } from '../SlicerTable'

type Props = {
  projectName: string | null
}

const useProjectAnatomySlices = ({ projectName }: Props) => {
  // project info
  const { data: project, isLoading } = useGetProjectQuery(
    { projectName: projectName || '' },
    { skip: !projectName },
  )

  //   Status
  const getStatuses = async () => {
    const statuses = project?.statuses as Status[] | undefined
    if (!statuses) return []

    // create table rows
    const statusTableRows: TableRow[] = statuses.map((status) => ({
      id: status.name,
      name: status.name,
      label: status.name,
      icon: typeof status.icon === 'string' ? status.icon : undefined,
      iconColor: status.color,
      subRows: [],
    }))

    return statusTableRows
  }

  //   merges folder types and tasks types into one table, but each type has a parent for folder or task
  const getTypes = async () => {
    const folderTypes = project?.folderTypes || []
    const taskTypes = project?.taskTypes || []

    // create table rows
    const folderTypeTableRows: TableRow[] = folderTypes.map((folderType) => ({
      id: folderType.name,
      parentId: 'folder',
      name: folderType.name,
      label: folderType.name,
      icon: folderType.icon,
      subRows: [],
    }))

    const taskTypeTableRows: TableRow[] = taskTypes.map((taskType) => ({
      id: taskType.name,
      parentId: 'task',
      name: taskType.name,
      label: taskType.name,
      icon: taskType.icon,
      subRows: [],
    }))

    return [
      {
        id: 'folder',
        name: 'folders',
        label: 'Folder Types',
        subRows: folderTypeTableRows,
      },
      {
        id: 'task',
        name: 'tasks',
        label: 'Task Types',
        subRows: taskTypeTableRows,
      },
    ]
  }

  return { project, getStatuses, getTypes, isLoading }
}

export default useProjectAnatomySlices
