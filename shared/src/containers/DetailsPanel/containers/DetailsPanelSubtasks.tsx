import { SubtasksManagerWrapper, SubtasksManagerWrapperProps } from '@shared/components'
import { FC, useMemo, useState } from 'react'
import TabHeaderAndFilters, {
  FilterItem,
} from '../components/TabHeaderAndFilters/TabHeaderAndFilters'
import { useLocalStorage } from '@shared/hooks'
import { QueryFilter, useGetUsersQuery } from '@shared/api'

interface DetailsPanelSubtasksProps extends SubtasksManagerWrapperProps {}

const DetailsPanelSubtasks: FC<DetailsPanelSubtasksProps> = ({ ...props }) => {
  const [subtasksFilters, setSubtasksFilters] = useState<QueryFilter>({})
  const [selectedSubtaskIds, setSelectedSubtaskIds] = useState<string[]>([])

  const { data: users = [] } = useGetUsersQuery({})

  const filters = useMemo<FilterItem<string>[]>(
    () => [
      {
        id: 'search',
        icon: 'search',
        tooltip: 'Search',
        type: 'search',
        placeholder: 'Search subtasks...',
      },
      {
        id: 'assignees',
        icon: 'person',
        tooltip: 'Assignees',
        type: 'enum',
        options: users.map((u: any) => ({
          label: u.attrib?.fullName || u.name,
          value: u.name,
          icon: `/api/users/${u.name}/avatar`,
        })),
        operator: 'includesany',
      },
      {
        id: 'done',
        icon: 'check_circle',
        tooltip: 'Done',
        type: 'boolean',
      },
    ],
    [users],
  )

  return (
    <>
      <TabHeaderAndFilters
        label={`Subtasks (${props.subtasks?.length || 0})`}
        filters={filters}
        currentFilter={subtasksFilters}
        onFilterChange={setSubtasksFilters}
      />
      <SubtasksManagerWrapper
        {...props}
        style={{ padding: 8, height: 'unset' }}
        title={null}
        selectedSubtaskIds={selectedSubtaskIds}
        onSelectSubtasks={setSelectedSubtaskIds}
        filters={subtasksFilters}
      />
    </>
  )
}

export default DetailsPanelSubtasks
