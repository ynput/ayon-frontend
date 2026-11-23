import { FC } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { useProjectContext } from '@shared/context'
import { buildScopes, useTraitFieldFilterOptions } from '@shared/components'
import { usePowerpack } from '@shared/context'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/vp-views'

// folderType/taskType are only whitelisted on the flat versions resolver — the
// products resolver (hierarchy mode) and task filters reject them server-side
const SCOPES = buildScopes(['version', 'product', 'task', 'folder', 'representation'], {
  version: ['folderType', 'taskType'],
  task: ['folderType'],
})

interface VPSearchFilterProps {}

const VPSearchFilter: FC<VPSearchFilterProps> = ({}) => {
  const { projectName, productBaseTypes, ...projectInfo } = useProjectContext()
  const { filters, onUpdateFilters } = useVPViewsContext()
  const { powerLicense } = usePowerpack()
  // representation trait fields, with the `PixelBased:width = 1920` syntax
  const traitFieldFilters = useTraitFieldFilterOptions({
    projectName,
    enableExcludes: powerLicense,
    enableRelativeValues: true,
  })

  return (
    <SearchFilterWrapper
      // @ts-ignore
      queryFilters={filters}
      onChange={onUpdateFilters}
      keepAppliedOptionsVisible
      scopes={SCOPES}
      projectNames={[projectName]}
      projectInfo={projectInfo}
      data={{ productTypes: projectInfo.productTypes, productBaseTypes }}
      config={{
        keys: { productName: 'name' },
      }}
      enableGlobalSearch={false}
      extraOptions={traitFieldFilters.options}
      parseSearchText={traitFieldFilters.parseSearchText}
    />
  )
}

export default VPSearchFilter
