import { useState, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { TablePanel } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { setUri } from '/src/features/context'
import groupResult from '/src/helpers/groupResult'

const columns = [
  {
    field: 'name',
    header: 'Name',
    width: 90,
    expander: true,
  },
  {
    field: 'folderName',
    header: 'Folder',
    width: 130,
  },
  {
    field: 'productName',
    header: 'Product',
    width: 130,
  },
  {
    field: 'Product type',
    header: 'productType',
    width: 110,
  },
]

const RepresentationList = ({ representations = [] }) => {
  const dispatch = useDispatch()
  const [selectedRepresentation, setSelectedRepresentation] = useState(null)
  //const [focusedRepresentation, setFocusedRepresentation] = useState(null)
  const projectName = 'TODO'

  const data = useMemo(() => {
    return groupResult(representations, 'name')
  }, [representations])

  const onRowClick = (e) => {
    let uri = `ayon+entity://${projectName}/`
    uri += `${e.node.data.folderParents.join('/')}/${e.node.data.folderName}`
    uri += `?product=${e.node.data.productName}`
    uri += `&version=${e.node.data.versionName}`
    uri += `&representation=${e.node.data.name}`
    dispatch(setUri(uri))
    if (e.originalEvent.detail === 2) {
      //setFocusedRepresentation(e.node.data.id)
    }
  }

  return (
    <>
      {/*focusedRepresentation && (
        <SiteSyncDetail
          projectName={projectName}
          localSite={null}
          remoteSite={null}
          representationId={focusedRepresentation}
          onHide={() => setFocusedRepresentation(null)}
        />
      )*/}
      <h4
        style={{
          margin: 0,
        }}
      >
        Representations
      </h4>
      <TablePanel>
        <TreeTable
          scrollable="true"
          scrollHeight="100%"
          value={data}
          emptyMessage="No representation found"
          selectionMode="single"
          selectionKeys={selectedRepresentation}
          onSelectionChange={(e) => setSelectedRepresentation(e.value)}
          onRowClick={onRowClick}
        >
          {columns.map((col) => {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                expander={col.expander}
                style={{ width: col.width }}
              />
            )
          })}
        </TreeTable>
      </TablePanel>
    </>
  )
}

export default RepresentationList
