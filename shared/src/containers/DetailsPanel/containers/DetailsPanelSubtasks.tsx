import { SubtasksManagerWrapper, SubtasksManagerWrapperProps } from '@shared/components'
import { FC, useMemo } from 'react'
import TabHeaderAndFilters, {
  FilterItem,
} from '../components/TabHeaderAndFilters/TabHeaderAndFilters'
import { useLocalStorage } from '@shared/hooks'
import { QueryFilter, useGetUsersQuery } from '@shared/api'

interface DetailsPanelSubtasksProps extends SubtasksManagerWrapperProps {}

const DetailsPanelSubtasks: FC<DetailsPanelSubtasksProps> = ({ ...props }) => {
  const [subtasksFilters, setSubtasksFilters] = useLocalStorage<QueryFilter>(
    'detailsPanelSubtasksFilters',
    {},
  )

  const { data: users = [] } = useGetUsersQuery({})

  const filters = useMemo<FilterItem<string>[]>(
    () => [
      {
        id: 'assignees',
        icon: 'person',
        tooltip: 'Assignees',
        type: 'enum',
        options: users.map((u: any) => ({
          label: u.attrib?.fullName || u.name,
          value: u.name,
        })),
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
      <SubtasksManagerWrapper {...props} style={{ padding: 8, height: 'unset' }} title={null} />
    </>
  )
}

export default DetailsPanelSubtasks
