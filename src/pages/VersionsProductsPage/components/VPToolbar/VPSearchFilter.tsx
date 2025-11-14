import { FC } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { useProjectDataContext } from '@shared/containers'
import { ScopeWithFilterTypes } from '@shared/components/SearchFilter/useBuildFilterOptions'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'

interface VPSearchFilterProps {}

const VPSearchFilter: FC<VPSearchFilterProps> = ({}) => {
  const { projectInfo, projectName } = useProjectDataContext()
  const { filters, onUpdateFilters } = useVPViewsContext()

  const scopesConfig: ScopeWithFilterTypes[] = [
    {
      scope: 'version',
      filterTypes: [
        'status',
        'tags',
        'productType',
        'author',
        'attributes',
        'version',
        'hasReviewables',
      ],
    },
    {
      scope: 'product',
      filterTypes: ['status', 'tags', 'attributes'],
    },
    {
      scope: 'task',
      filterTypes: ['status', 'tags', 'taskType', 'assignees', 'attributes'],
    },
  ]

  return (
    <SearchFilterWrapper
      // @ts-ignore
      queryFilters={filters}
      onChange={onUpdateFilters}
      scopes={scopesConfig}
      projectNames={[projectName]}
      projectInfo={projectInfo}
      enableGlobalSearch={false}
    />
  )
}

export default VPSearchFilter
