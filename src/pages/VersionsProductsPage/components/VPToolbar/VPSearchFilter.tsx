import { FC } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { useProjectContext } from '@shared/context'
import { buildScopes } from '@shared/components'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/vp-views'

// folderType/taskType are only whitelisted on the flat versions resolver — the
// products resolver (hierarchy mode) and task filters reject them server-side
const SCOPES = buildScopes(['version', 'product', 'task', 'folder', 'representation'], {
  version: ['folderType', 'taskType'],
  task: ['folderType'],
})

// these options are not filter conditions: the page turns them into query arguments
// (featured versions, reviewables) or into a path match (extension)
const ADVANCED_FILTER_EXCLUDE = [
  'version_version',
  'version_hasReviewables',
  'representation_extension',
]

interface VPSearchFilterProps {}

const VPSearchFilter: FC<VPSearchFilterProps> = ({}) => {
  const { projectName, productBaseTypes, ...projectInfo } = useProjectContext()
  const { filters, onUpdateFilters, advancedFilter, onUpdateAdvancedFilter } = useVPViewsContext()

  return (
    <SearchFilterWrapper
      // @ts-ignore
      queryFilters={filters}
      onChange={onUpdateFilters}
      advancedFilter={advancedFilter}
      onAdvancedFilterChange={onUpdateAdvancedFilter}
      advancedFilterExclude={ADVANCED_FILTER_EXCLUDE}
      keepAppliedOptionsVisible
      scopes={SCOPES}
      projectNames={[projectName]}
      projectInfo={projectInfo}
      data={{ productTypes: projectInfo.productTypes, productBaseTypes }}
      config={{
        keys: { productName: 'name' },
      }}
      enableGlobalSearch={false}
    />
  )
}

export default VPSearchFilter
