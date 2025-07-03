import { useMemo, useState } from 'react'
import { TablePanel } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { groupResult } from '@shared/util'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { DetailsDialog } from '@shared/components'
import versionsToRepresentations from './versionsToRepresentations'
import { DetailsPanelEntityData } from '@shared/api'

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

export const RepresentationsList = ({ entities = [] }: Props) => {
  // merge all entities data into one array of entities
  const representations = useMemo(() => versionsToRepresentations(entities) || [], [entities])

  const [showDetail, setShowDetail] = useState<false | string>(false)
  const showDetailProjectName = representations.find((rep) => rep.id === showDetail)?.projectName

  const [selected, setSelected] = useState<string[]>([])

  const data = useMemo(() => {
    // @ts-expect-error - groupResult is not typed
    return groupResult(representations, 'name')
  }, [representations])

  const onRepSelectionChange = (entityId: string) => {
    // set focused state
    setSelected([entityId])
  }

  const onRowClick = (e: any) => {
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

  return (
    <>
      <TablePanel>
        <TreeTable
          scrollable
          scrollHeight="100%"
          value={data}
          emptyMessage="No representation found"
          selectionMode="single"
          selectionKeys={selected[0]}
          onRowClick={onRowClick}
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

      {showDetail && (
        <DetailsDialog
          projectName={showDetailProjectName}
          entityType={'representation'}
          entityIds={[showDetail]}
          visible={!!showDetail}
          onHide={() => setShowDetail(false)}
        />
      )}
    </>
  )
}
