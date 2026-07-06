import { SubtasksManagerWrapper, SubtasksManagerWrapperProps } from '@shared/components'
import { FC, useMemo, useState } from 'react'
import TabHeaderAndFilters from '../components/TabHeaderAndFilters/TabHeaderAndFilters'
import SubtasksSearchFilter from '../components/SubtasksSearchFilter/SubtasksSearchFilter'
import { QueryFilter, useGetUsersAssigneeQuery } from '@shared/api'
import { expandRelativeDates } from '@shared/containers/ProjectTreeTable/utils/expandRelativeDates'

interface DetailsPanelSubtasksProps extends SubtasksManagerWrapperProps {}

const DetailsPanelSubtasks: FC<DetailsPanelSubtasksProps> = ({ ...props }) => {
  const [subtasksFilters, setSubtasksFilters] = useState<QueryFilter>({})
  const [searchText, setSearchText] = useState('')
  const [selectedSubtaskIds, setSelectedSubtaskIds] = useState<string[]>([])

  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName: props.projectName })

  const totalCount = props.subtasks?.length || 0
  const doneCount = props.subtasks?.filter((s) => s.isDone).length || 0

  const mergedFilters = useMemo(() => {
    let filters: QueryFilter = subtasksFilters

    if (searchText) {
      const searchCondition = { key: 'search', operator: 'like', value: searchText }
      filters = {
        ...subtasksFilters,
        conditions: [...(subtasksFilters.conditions || []), searchCondition],
        operator: 'and',
      } as QueryFilter
    }

    return expandRelativeDates(filters as any) as QueryFilter
  }, [subtasksFilters, searchText])

  return (
    <>
      <TabHeaderAndFilters
        label={`Subtasks (${totalCount})`}
        filters={[]}
        currentFilter={subtasksFilters}
        onFilterChange={setSubtasksFilters}
      />
      <SubtasksSearchFilter
        subtasksFilter={subtasksFilters}
        setSubtasksFilter={setSubtasksFilters}
        users={users}
        totalCount={totalCount}
        doneCount={doneCount}
        onSearchTextChange={setSearchText}
      />
      <SubtasksManagerWrapper
        {...props}
        style={{ padding: 8, height: 'unset' }}
        title={null}
        selectedSubtaskIds={selectedSubtaskIds}
        onSelectSubtasks={setSelectedSubtaskIds}
        filters={mergedFilters}
        actionsPortalClassName="panel-header-filters"
      />
    </>
  )
}

export default DetailsPanelSubtasks
