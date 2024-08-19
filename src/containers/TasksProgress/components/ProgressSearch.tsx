import { FolderRow } from '@containers/TasksProgress/helpers/formatTaskProgressForTable'
import { filterByFieldsAndValues } from '@hooks/useSearchFilter'
import { InputText } from '@ynput/ayon-react-components'
import { throttle } from 'lodash'
import { forwardRef, useCallback, useEffect, useState } from 'react'

interface ProgressSearchProps extends React.HTMLAttributes<HTMLInputElement> {
  data: FolderRow[]
  onSearch: (folderIds: string[] | null, taskIds: string[]) => void
}

export const ProgressSearch = forwardRef<HTMLInputElement, ProgressSearchProps>(
  ({ data, onSearch, ...props }, ref) => {
    const [search, setSearch] = useState('')

    const searchTable = () => {
      let taskIds: string[] = []
      // if there is a search, filter out rows that have no matches and highlight tasks that match

      const folderIds = data
        .filter((row) => {
          // find matches on the folder itself
          const folderMatch = row._folder.toLowerCase().includes(search)
          // find matches on the tasks of the folder
          const taskTypes = Object.entries(row).filter(
            ([key, value]) => typeof value === 'object' && !key.startsWith('_'),
          )
          const allTasks = taskTypes.flatMap(([_, taskTypeRow]) => {
            if (typeof taskTypeRow === 'string') {
              return []
            }
            return taskTypeRow.tasks
          })

          const filteredTasks = filterByFieldsAndValues({
            filters: [search],
            data: allTasks,
            fields: ['name', 'label', 'taskType', 'status', 'assignees'],
          })

          const anyMatches = folderMatch || filteredTasks.length

          if (filteredTasks.length && search.length > 1) {
            taskIds.push(...filteredTasks.map((task) => task.id))
          }

          return anyMatches
        })
        .map((row) => row.__folderId)

      return [folderIds, taskIds]
    }

    const throttledSearch = useCallback(
      throttle((f, t) => onSearch(f, t), 500),
      [],
    )

    useEffect(() => {
      if (search) {
        const results = searchTable()
        throttledSearch(results[0], results[1])
      } else {
        onSearch(null, [])
      }
    }, [search])

    return (
      <InputText
        ref={ref}
        placeholder="Search and filter..."
        data-tooltip={'Search for folders, tasks, assignees, statuses, or task types'}
        value={search}
        onChange={(e) => setSearch(e.target.value.toLowerCase())}
        {...props}
      />
    )
  },
)
