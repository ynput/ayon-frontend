import { useGetTasksProgressQuery } from '@queries/tasksProgress/getTasksProgress'
import { $Any } from '@types'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { FC, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { formatTaskProgressForTable, generateTaskColumns } from './helpers'
import { useGetProjectQuery } from '@queries/project/getProject'
import { useGetAllProjectUsersAsAssigneeQuery } from '@queries/user/getUsers'
import { TaskFieldChange } from './helpers/generateTaskColumns'
import { FolderBody } from './components'
import { FolderRow } from './helpers/formatTaskProgressForTable'

interface TasksProgressProps {}

const TasksProgress: FC<TasksProgressProps> = ({}) => {
  const selectedFolders = useSelector((state: $Any) => state.context.focused.folders) as string[]
  const projectName = useSelector((state: $Any) => state.project.name) as string

  const [expandedRows, setExpandedRows] = useState<string[]>([])

  //   GET PROJECT INFO FOR STATUS
  const { data: { statuses = [], taskTypes = [] } = {} } = useGetProjectQuery(
    { projectName },
    { skip: !projectName },
  )

  //   GET PROJECT ASSIGNEES
  const { data: users = [] } = useGetAllProjectUsersAsAssigneeQuery(
    { projectName },
    { skip: !projectName },
  )

  // GET TASKS PROGRESS FOR FOLDERS
  const { data: foldersTasksData = [] } = useGetTasksProgressQuery(
    { projectName, folderIds: selectedFolders },
    { skip: !selectedFolders.length || !projectName },
  )

  const tableData = useMemo(() => formatTaskProgressForTable(foldersTasksData), [foldersTasksData])

  const handleTaskFieldChange: TaskFieldChange = async (id, key, value) => {}

  const taskColumns = useMemo(
    () =>
      generateTaskColumns({
        tableData,
        expandedRows,
        statuses,
        users,
        taskTypes,
        onChange: handleTaskFieldChange,
      }),
    [tableData, statuses, users, expandedRows],
  )

  const handleExpandToggle = (folderId: string) => {
    // update the expanded rows by either adding or removing the folderId
    setExpandedRows((prev) => {
      if (prev.includes(folderId)) {
        return prev.filter((id) => id !== folderId)
      }
      return [...prev, folderId]
    })
  }

  return (
    <div>
      <DataTable value={tableData}>
        <Column
          field="_folder"
          header="Folder"
          body={(row: FolderRow) => (
            <FolderBody
              name={row._folder}
              isExpanded={expandedRows.includes(row.__folderId)}
              onExpandToggle={() => handleExpandToggle(row.__folderId)}
            />
          )}
        />
        {taskColumns}
      </DataTable>
    </div>
  )
}

export default TasksProgress
