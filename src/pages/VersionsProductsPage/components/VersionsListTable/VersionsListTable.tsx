import { useVersionsDataContext } from '@pages/VersionsProductsPage/context/VPDataContext'
import { useVersionsSelectionContext } from '@pages/VersionsProductsPage/context/VPSelectionContext'
import { buildVersionsTableRows } from '@pages/VersionsProductsPage/util'
import SimpleTable, { SimpleTableProvider } from '@shared/containers/SimpleTable'
import { RowSelectionState } from '@tanstack/react-table'
import { FC, useMemo } from 'react'
import * as Styled from './VersionsListTable.styled'
import { useProjectDataContext } from '@shared/containers'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { guessImgRatio } from '@pages/VersionsProductsPage/util/guessImgRatio'

interface VersionsListTableProps {}

const VersionsListTable: FC<VersionsListTableProps> = ({}) => {
  const { projectName } = useProjectDataContext()
  const { selectedProducts, selectedVersions, setSelectedVersions } = useVersionsSelectionContext()
  const { productsMap } = useVersionsDataContext()
  const { columns, rowHeight } = useVPViewsContext()
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
        <SimpleTable
          data={versionsTableData}
          isLoading={false}
          imgRatio={ratio}
          pt={{
            cell: {
              style: {
                padding: 4,
              },
              pt: {
                img: {
                  style: {
                    height: 40,
                    maxHeight: 40,
                  },
                },
              },
            },
          }}
        />
      </SimpleTableProvider>
    </Styled.TablePanel>
  )
}

export default VersionsListTable
