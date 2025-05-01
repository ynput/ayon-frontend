import { useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@state/store'
import { TablePanel } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { setExpandedReps, setFocusedRepresentations, setUri } from '@state/context'
import groupResult from '@helpers/groupResult'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import DetailsDialog from '../DetailsDialog'
import versionsToRepresentations from './versionsToRepresentations'
import { DetailsPanelEntityData } from '@queries/entity/transformDetailsPanelData'

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

type Props = {
  entities: DetailsPanelEntityData[]
}

const RepresentationList = ({ entities = [] }: Props) => {
  // merge all entities data into one array of entities
  const representations = useMemo(() => versionsToRepresentations(entities) || [], [entities])

  const [showDetail, setShowDetail] = useState<false | string>(false)
  const showDetailProjectName = representations.find((rep) => rep.id === showDetail)?.projectName

  const dispatch = useAppDispatch()
  const focusedRepresentations = useAppSelector((state) => state.context.focused.representations)
  const expandedRepresentations = useAppSelector((state) => state.context.expandedRepresentations)

  const data = useMemo(() => {
    return groupResult(representations, 'name')
  }, [representations])

  const onRepSelectionChange = (entityId: string) => {
    // set focused state
    dispatch(setFocusedRepresentations([entityId]))
  }

  const onRowClick = (e: any) => {
    const projectName = e.node.data.projectName

    let uri = `ayon+entity://${projectName}/`
    uri += `${e.node.data.folderParents.join('/')}/${e.node.data.folderName}`
    uri += `?product=${e.node.data.productName}`
    uri += `&version=${e.node.data.versionName}`
    uri += `&representation=${e.node.data.name}`
    dispatch(setUri(uri))

    onRepSelectionChange(e.node.data.id)
  }

  const ctxMenuItems = (id: string) => [
    {
      label: 'Representation detail',
      command: () => setShowDetail(id),
      icon: 'database',
    },
  ]

  const [ctxMenuShow] = useCreateContextMenu([])

  const handleContextMenu = (e: any) => {
    const id = e.node.data.id

    if (id) {
      // update focused representations
      onRepSelectionChange(id)
      // open context menu
      ctxMenuShow(e.originalEvent, ctxMenuItems(id))
    }
  }

  const handleToggle = (e: any) => {
    dispatch(setExpandedReps(e.value))
  }

  return (
    <>
      <TablePanel>
        <TreeTable
          scrollable
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
      <DetailsDialog
        projectName={showDetailProjectName}
        entityType={'representation'}
        entityIds={[showDetail]}
        visible={!!showDetail}
        onHide={() => setShowDetail(false)}
      />
    </>
  )
}

export default RepresentationList
