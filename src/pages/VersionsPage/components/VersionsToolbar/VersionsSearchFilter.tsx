import { FC } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { useProjectDataContext } from '@shared/containers'
import { ScopeWithFilterTypes } from '@shared/components/SearchFilter/useBuildFilterOptions'
import { useVersionsViewsContext } from '@pages/VersionsPage/context/VersionsViewsContext'

interface VersionsSearchFilterProps {}

const VersionsSearchFilter: FC<VersionsSearchFilterProps> = ({}) => {
  const { projectInfo, projectName } = useProjectDataContext()
  const { filters, onUpdateFilters } = useVersionsViewsContext()

  const scopesConfig: ScopeWithFilterTypes[] = [
    {
      scope: 'version',
      filterTypes: ['status', 'tags', 'author', 'attributes'],
    },
    {
      scope: 'product',
      filterTypes: ['status', 'tags', 'productType', 'attributes'],
    },
    {
      scope: 'task',
      filterTypes: ['status', 'tags', 'taskType', 'assignees', 'attributes'],
    },
  ]

  return (
    <SearchFilterWrapper
      queryFilters={filters}
      onChange={onUpdateFilters}
      scopes={scopesConfig}
      projectNames={[projectName]}
      projectInfo={projectInfo}
      enableGlobalSearch={false}
    />
  )
}

export default VersionsSearchFilter
