import { FC } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { useProjectContext } from '@shared/context'
import { buildScopes } from '@shared/components'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'

// folderType/taskType are only whitelisted on the flat versions resolver — the
// products resolver (hierarchy mode) and task filters reject them server-side
const SCOPES = buildScopes(['version', 'product', 'task'], {
  version: ['folderType', 'taskType'],
  task: ['folderType'],
})

interface VPSearchFilterProps {}

const VPSearchFilter: FC<VPSearchFilterProps> = ({}) => {
  const { projectName, productBaseTypes, ...projectInfo } = useProjectContext()
  const { filters, onUpdateFilters } = useVPViewsContext()

  return (
    <SearchFilterWrapper
      // @ts-ignore
      queryFilters={filters}
      onChange={onUpdateFilters}
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
