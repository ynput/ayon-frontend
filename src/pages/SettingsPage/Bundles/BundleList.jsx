import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { Badge, BadgeWrapper } from '/src/components/Badge'
import { TablePanel } from '@ynput/ayon-react-components'
import useCreateContext from '/src/hooks/useCreateContext'
import { useUpdateBundleMutation } from '/src/services/bundles'
import { useMemo } from 'react'

const BundleList = ({
  selectedBundle,
  onBundleSelect,
  bundleList,
  isLoading,
  onDuplicate,
  onDelete,
  toggleBundleStatus,
}) => {
  const [updateBundle] = useUpdateBundleMutation()

  // sort bundleList so that isArchived is at the bottom
  const sortedBundleList = useMemo(() => {
    const archived = bundleList.filter((b) => b.isArchived)
    const notArchived = bundleList.filter((b) => !b.isArchived)
    return [...notArchived, ...archived]
  }, [bundleList])

  const onArchive = (name, isArchived) => {
    const bundle = bundleList.find((b) => b.name === selectedBundle)
    if (!bundle) return
    const patch = { ...bundle, isArchived: !isArchived }
    updateBundle({ name, data: { isArchived: !isArchived, patch } })
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
          command: () => toggleBundleStatus('production', activeBundle),
        })
      } else {
        ctxMenuItems.push({
          label: 'Set Production',
          icon: 'check',
          command: () => toggleBundleStatus('production', activeBundle),
        })
      }
      // staging
      if (isStaging) {
        ctxMenuItems.push({
          label: 'Unset Staging',
          icon: 'cancel',
          command: () => toggleBundleStatus('staging', activeBundle),
        })
      } else {
        ctxMenuItems.push({
          label: 'Set Staging',
          icon: 'check',
          command: () => toggleBundleStatus('staging', activeBundle),
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

    const metaKey = e.originalEvent.metaKey || e.originalEvent.ctrlKey

    if (metaKey || isArchived) {
      // secret delete bundle
      ctxMenuItems.push({
        label: 'Delete',
        icon: 'delete',
        command: () => onDelete(activeBundle),
        disabled: isStaging || isProduction,
        danger: true,
      })
    }

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
        <Column header="Status" body={formatStatus} style={{ maxWidth: 120 }} />
      </DataTable>
    </TablePanel>
  )
}

export default BundleList
