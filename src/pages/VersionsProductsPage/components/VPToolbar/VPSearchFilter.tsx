import { FC, useMemo } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { useProjectContext } from '@shared/context'
import { buildScopes } from '@shared/components'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { useVersionsDataContext } from '@pages/VersionsProductsPage/context/VPDataContext'

// folderType/taskType are only whitelisted on the flat versions resolver — the
// products resolver (hierarchy mode) and task filters reject them server-side
const SCOPES = buildScopes(['version', 'product', 'task'], {
  version: ['folderType', 'taskType'],
  task: ['folderType'],
})

interface VPSearchFilterProps {}

const VPSearchFilter: FC<VPSearchFilterProps> = ({}) => {
  const { projectName, ...projectInfo } = useProjectContext()
  const { filters, onUpdateFilters } = useVPViewsContext()
  const { productsMap, versionsMap } = useVersionsDataContext()

  const data = useMemo(
    () => ({
      productNames: [
        ...new Set(
          productsMap.size
            ? Array.from(productsMap.values()).map((product) => product.name)
            : Array.from(versionsMap.values()).map((version) => version.product.name),
        ),
      ],
      productBaseTypes: [
        ...new Set(
          (productsMap.size
            ? Array.from(productsMap.values()).map((product) => product.productBaseType)
            : Array.from(versionsMap.values()).map((version) => version.product.productBaseType)
          ).filter((v): v is string => !!v),
        ),
      ],
    }),
    [productsMap, versionsMap],
  )

  return (
    <SearchFilterWrapper
      // @ts-ignore
      queryFilters={filters}
      onChange={onUpdateFilters}
      scopes={SCOPES}
      projectNames={[projectName]}
      projectInfo={projectInfo}
      data={data}
      config={{
        keys: { productName: 'name' },
      }}
      enableGlobalSearch={false}
    />
  )
}

export default VPSearchFilter
