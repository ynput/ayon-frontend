import { FC, useMemo } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { useProjectContext } from '@shared/context'
import { ScopeWithFilterTypes } from '@shared/components/SearchFilter/useBuildFilterOptions'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { useVersionsDataContext } from '@pages/VersionsProductsPage/context/VPDataContext'

interface VPSearchFilterProps {}

const VPSearchFilter: FC<VPSearchFilterProps> = ({}) => {
  const { projectName, ...projectInfo } = useProjectContext()
  const { filters, onUpdateFilters } = useVPViewsContext()
  const { productsMap, versionsMap } = useVersionsDataContext()

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
      filterTypes: ['status', 'tags', 'attributes', 'productName'],
    },
    {
      scope: 'task',
      filterTypes: ['status', 'tags', 'taskType', 'assignees', 'attributes'],
    },
  ]

  const data = useMemo(
    () => ({
      productNames: [
        ...new Set(
          productsMap.size
            ? Array.from(productsMap.values()).map((product) => product.name)
            : Array.from(versionsMap.values()).map((version) => version.product.name),
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
      scopes={scopesConfig}
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
