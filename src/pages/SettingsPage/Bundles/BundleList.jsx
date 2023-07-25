import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { Badge, BadgeWrapper } from '/src/components/Badge'
import { TablePanel } from '@ynput/ayon-react-components'
import useCreateContext from '/src/hooks/useCreateContext'
import { useUpdateBundleMutation } from '/src/services/bundles'
import { useMemo } from 'react'

const BundleList = ({ selectedBundle, onBundleSelect, bundleList, isLoading, onDuplicate }) => {
  const [updateBundle] = useUpdateBundleMutation()

  // sort bundleList so that isArchived is at the bottom
  const sortedBundleList = useMemo(() => {
    const archived = bundleList.filter((b) => b.isArchived)
    const notArchived = bundleList.filter((b) => !b.isArchived)
    return [...notArchived, ...archived]
  }, [bundleList])

  const onSetProduction = (name) => {
    updateBundle({ name, isProduction: true })
  }

  const onSetStaging = (name) => {
    updateBundle({ name, isStaging: true })
  }

  const onUnsetProduction = (name) => {
    updateBundle({ name, isProduction: false })
  }

  const onUnsetStaging = (name) => {
    updateBundle({ name, isStaging: false })
  }

  const onArchive = (name, isArchived) => {
    updateBundle({ name, isArchived: !isArchived })
  }

  const [ctxMenuShow] = useCreateContext([])

  const onContextMenu = (e) => {
    const ctxMenuItems = []
    const activeBundle = e?.data?.name
    const isArchived = e?.data?.isArchived
    const isProduction = e?.data?.isProduction
    const isStaging = e?.data?.isStaging
    if (!activeBundle) {
      return
    }
    if (!isArchived) {
      // production
      if (isProduction) {
        ctxMenuItems.push({
          label: 'Unset Production',
          icon: 'cancel',
          command: () => onUnsetProduction(activeBundle),
        })
      } else {
        ctxMenuItems.push({
          label: 'Set Production',
          icon: 'check',
          command: () => onSetProduction(activeBundle),
        })
      }
      // staging
      if (isStaging) {
        ctxMenuItems.push({
          label: 'Unset Staging',
          icon: 'cancel',
          command: () => onUnsetStaging(activeBundle),
        })
      } else {
        ctxMenuItems.push({
          label: 'Set Staging',
          icon: 'check',
          command: () => onSetStaging(activeBundle),
        })
      }
    }

    // duplicate and edit
    ctxMenuItems.push({
      label: 'Duplicate and Edit',
      icon: 'edit_document',
      command: () => onDuplicate(activeBundle),
    })

    // duplicate and edit
    ctxMenuItems.push({
      label: isArchived ? 'Unarchive' : 'Archive',
      icon: isArchived ? 'unarchive' : 'archive',
      command: () => onArchive(activeBundle, isArchived),
      disabled: isStaging || isProduction,
    })

    ctxMenuShow(e.originalEvent, ctxMenuItems)
  }

  const formatStatus = (rowData) => {
    return (
      <BadgeWrapper
        style={{
          justifyContent: 'flex-end',
          width: '100%',
          padding: '0 8px',
          marginLeft: 0,
        }}
      >
        {rowData.isProduction && <Badge hl="production">Production</Badge>}
        {rowData.isStaging && <Badge hl="staging">Staging</Badge>}
      </BadgeWrapper>
    )
  }

  return (
    <TablePanel loading={isLoading}>
      <DataTable
        value={sortedBundleList}
        scrollable
        scrollHeight="flex"
        selectionMode="single"
        responsive="true"
        dataKey="name"
        onContextMenu={(e) => onContextMenu(e)}
        selection={{ name: selectedBundle }}
        onSelectionChange={(e) => onBundleSelect(e.value.name)}
        onContextMenuSelectionChange={(e) => onBundleSelect(e.value.name)}
        rowClassName={(rowData) => (rowData.isArchived ? 'archived' : '')}
        className="bundles-table"
      >
        <Column
          field="name"
          header="Name"
          body={(b) => `${b.name} ${b.isArchived ? '(archived)' : ''}`}
        />
        <Column header="Status" body={formatStatus} style={{ maxWidth: 73 }} />
      </DataTable>
    </TablePanel>
  )
}

export default BundleList
