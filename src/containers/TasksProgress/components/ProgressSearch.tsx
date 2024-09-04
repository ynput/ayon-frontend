import { FolderRow } from '@containers/TasksProgress/helpers/formatTaskProgressForTable'
import { filterByFieldsAndValues } from '@hooks/useSearchFilter'
import { InputText } from '@ynput/ayon-react-components'
import { throttle } from 'lodash'
import { forwardRef, useCallback, useEffect, useState } from 'react'

interface ProgressSearchProps extends React.HTMLAttributes<HTMLInputElement> {
  data: FolderRow[]
  onSearch: (folderIds: string[] | null) => void
}

export const ProgressSearch = forwardRef<HTMLInputElement, ProgressSearchProps>(
  ({ data, onSearch, ...props }, ref) => {
    const [search, setSearch] = useState('')

    const searchTable = () => {
      // if there is a search, filter out rows that have no matches and highlight tasks that match
      const folderIds: string[] = []

      data
        .filter((row) => {
          // find matches on the folder itself
          const folderMatch = row._folder.toLowerCase().includes(search)
          // check if any parents match
          const parentMatch =
            row.__parentId && row._parents.some((parent) => parent.toLowerCase().includes(search))
          // find matches on the tasks of the folder
          const taskTypes = Object.entries(row).filter(
            ([key, value]) => typeof value === 'object' && !key.startsWith('_'),
          )
          const allTasks = taskTypes.flatMap(([_, taskTypeRow]) => {
            if (
              !taskTypeRow ||
              typeof taskTypeRow === 'string' ||
              typeof taskTypeRow === 'number'
            ) {
              return []
            }
            return taskTypeRow.tasks || []
          })

          const filteredTasks = filterByFieldsAndValues({
            filters: [search],
            data: allTasks,
            fields: ['name', 'label', 'taskType', 'status', 'assignees'],
          })

          const anyMatches = folderMatch || parentMatch || filteredTasks.length

          return anyMatches
        })
        .forEach((row) => {
          folderIds.push(row.__folderId)
          row.__parentId && folderIds.push(row.__parentId)
        })

      return folderIds
    }

    const throttledSearch = useCallback(
      throttle((f) => onSearch(f), 500),
      [],
    )

    useEffect(() => {
      if (search) {
        const results = searchTable()
        throttledSearch(results)
      } else {
        onSearch(null)
      }
    }, [search, data, onSearch])

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
