import { ProjectTreeTable } from '@shared/containers'
import { FC } from 'react'
import { useVersionsDataContext } from '../../context/VersionsDataContext'

interface ProductsAndVersionsTableProps {
  readOnly?: string[]
}

const ProductsAndVersionsTable: FC<ProductsAndVersionsTableProps> = ({ readOnly = [] }) => {
  const { fetchNextPage, showProducts } = useVersionsDataContext()

  return (
    <ProjectTreeTable
      scope={'versions-and-products'}
      sliceId={''}
      // pagination
      onScrollBottom={fetchNextPage}
      readOnly={readOnly}
      excludedColumns={['assignees']}
      isExpandable={showProducts}
    />
  )
}

export default ProductsAndVersionsTable
