import { ProjectTreeTable } from '@shared/containers'
import { FC } from 'react'
import { useVersionsDataContext } from '../../context/VersionsDataContext'
import { useVersionsViewsContext } from '@pages/VersionsPage/context/VersionsViewsContext'

interface ProductsAndVersionsTableProps {
  readOnly?: string[]
}

const ProductsAndVersionsTable: FC<ProductsAndVersionsTableProps> = ({ readOnly = [] }) => {
  const { fetchNextPage, isLoading } = useVersionsDataContext()
  const { showProducts } = useVersionsViewsContext()

  return (
    <ProjectTreeTable
      scope={'versions-and-products'}
      sliceId={''}
      // pagination
      onScrollBottom={() => fetchNextPage()}
      onScrollBottomGroupBy={(groupValue: string) => fetchNextPage(groupValue)}
      readOnly={readOnly}
      excludedColumns={['assignees']}
      isExpandable={showProducts}
      isLoading={isLoading}
      includeLinks={false}
      columnsConfig={{
        name: {
          display: { path_compact: false, path_full: true },
        },
      }}
    />
  )
}

export default ProductsAndVersionsTable
