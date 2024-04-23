import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { TablePanel } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { setExpandedReps, setFocusedRepresentations, setUri } from '/src/features/context'
import groupResult from '/src/helpers/groupResult'
import useCreateContext from '/src/hooks/useCreateContext'
import EntityDetail from '/src/containers/entityDetail'

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

const RepresentationList = ({ projectName, representations = [] }) => {
  const [showDetail, setShowDetail] = useState(false)

  const dispatch = useDispatch()
  const focusedRepresentations = useSelector((state) => state.context.focused.representations)
  const expandedRepresentations = useSelector((state) => state.context.expandedRepresentations)

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

    dispatch(setFocusedRepresentations([e.node.data.id]))
  }

  const ctxMenuItems = (id) => [
    {
      label: 'Representation detail',
      command: () => setShowDetail(id),
      icon: 'database',
    },
  ]

  const [ctxMenuShow] = useCreateContext([])

  const handleContextMenu = (e) => {
    const id = e.node.data.id
    if (id) {
      // update focused representations
      dispatch(setFocusedRepresentations([id]))
      // open context menu
      ctxMenuShow(e.originalEvent, ctxMenuItems(id))
    }
  }

  const handleToggle = (e) => {
    dispatch(setExpandedReps(e.value))
  }

  return (
    <>
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
          selectionKeys={focusedRepresentations[0]}
          onRowClick={onRowClick}
          expandedKeys={expandedRepresentations}
          onToggle={handleToggle}
          onContextMenu={handleContextMenu}
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
      <EntityDetail
        projectName={projectName}
        entityType={'representation'}
        entityIds={[showDetail]}
        visible={!!showDetail}
        onHide={() => setShowDetail(false)}
      />
    </>
  )
}

export default RepresentationList
