import { useVersionsDataContext } from '@pages/VersionsPage/context/VersionsDataContext'
import { useVersionsSelectionContext } from '@pages/VersionsPage/context/VersionsSelectionContext'
import { buildVersionsTableRows } from '@pages/VersionsPage/util'
import SimpleTable, { SimpleTableProvider } from '@shared/containers/SimpleTable'
import { RowSelectionState } from '@tanstack/react-table'
import { FC, useMemo } from 'react'
import * as Styled from './ProductVersionsTable.styled'
import { useProjectDataContext } from '@shared/containers'
import { useVersionsViewsContext } from '@pages/VersionsPage/context/VersionsViewsContext'
import { guessImgRatio } from '@pages/VersionsPage/util/guessImgRatio'

interface ProductVersionsTableProps {}

const ProductVersionsTable: FC<ProductVersionsTableProps> = ({}) => {
  const { projectName } = useProjectDataContext()
  const { selectedProducts, selectedVersions, setSelectedVersions } = useVersionsSelectionContext()
  const { productsMap } = useVersionsDataContext()
  const { columns, rowHeight } = useVersionsViewsContext()
  const ratio = useMemo(() => guessImgRatio(rowHeight, columns), [rowHeight, columns])

  const versionsTableData = useMemo(
    () => buildVersionsTableRows({ projectName, productsMap, productIds: selectedProducts }),
    [selectedProducts, productsMap, projectName],
  )

  const rowSelection = useMemo<RowSelectionState>(() => {
    const selection: RowSelectionState = {}
    selectedVersions.forEach((versionId) => {
      selection[versionId] = true
    })
    return selection
  }, [selectedVersions])

  const handleRowSelectionChange = (selection: RowSelectionState) => {
    // convert back to array of version IDs
    const selectedIds = Object.keys(selection).filter((id) => selection[id])
    setSelectedVersions(selectedIds)
  }

  return (
    <Styled.TablePanel style={{ height: '100%', padding: 0 }}>
      <Styled.Header>
        <h3>Versions</h3>
      </Styled.Header>
      <SimpleTableProvider
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
      >
        <SimpleTable data={versionsTableData} isLoading={false} imgRatio={ratio} />
      </SimpleTableProvider>
    </Styled.TablePanel>
  )
}

export default ProductVersionsTable
