import { FC } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { useVersionsDataContext } from '@pages/VersionsPage/context/VersionsDataContext'
import { useProjectDataContext } from '@shared/containers'
import { ScopeWithFilterTypes } from '@shared/components/SearchFilter/useBuildFilterOptions'

interface VersionsSearchFilterProps {}

const VersionsSearchFilter: FC<VersionsSearchFilterProps> = ({}) => {
  const { projectInfo, projectName } = useProjectDataContext()
  const { filter, setFilter } = useVersionsDataContext()

  const scopesConfig: ScopeWithFilterTypes[] = [
    {
      scope: 'version',
      filterTypes: ['status', 'author', 'tags', 'attributes'],
    },
    {
      scope: 'product',
      filterTypes: ['status', 'tags', 'productType', 'attributes'],
    },
  ]

  return (
    <SearchFilterWrapper
      queryFilters={filter}
      onChange={setFilter}
      scopes={scopesConfig}
      projectNames={[projectName]}
      projectInfo={projectInfo}
      enableGlobalSearch={false}
    />
  )
}

export default VersionsSearchFilter
