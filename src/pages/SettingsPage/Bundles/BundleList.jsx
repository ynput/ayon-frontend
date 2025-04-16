import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { Badge, BadgeWrapper } from '@components/Badge'
import { TablePanel } from '@ynput/ayon-react-components'
import useCreateContextMenu from '@shared/ContextMenu/useCreateContextMenu'
import { useDeleteBundleMutation, useUpdateBundleMutation } from '@queries/bundles/updateBundles'
import { useMemo } from 'react'
import { confirmDelete } from '@shared/helpers'
import { toast } from 'react-toastify'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'

const BundleList = ({
  selectedBundles = [],
  onBundleSelect,
  bundleList,
  isLoading,
  onDuplicate,
  onCopySettings,
  toggleBundleStatus,
  errorMessage,
  developerMode,
}) => {
  const prodBundleName = useMemo(() => bundleList.find((b) => b.isProduction)?.name, [bundleList])
  const stagingBundleName = useMemo(() => bundleList.find((b) => b.isStaging)?.name, [bundleList])
  const hasDevBundles = useMemo(() => bundleList.some((b) => b.isDev), [bundleList])

  const [updateBundle] = useUpdateBundleMutation()
  const [deleteBundle] = useDeleteBundleMutation()

  // sort bundleList so that isArchived is at the bottom
  const sortedBundleList = useMemo(() => {
    const archived = bundleList.filter((b) => b?.isArchived)
    const notArchived = bundleList.filter((b) => !b?.isArchived)
    return [...notArchived, ...archived].filter((b) => b !== undefined)
  }, [bundleList])

  const onArchive = async (bundles = [], isArchived = true) => {
    try {
      await Promise.all(
        bundles.map((bundle) => {
          const patch = { ...bundle, isArchived }
          return updateBundle({
            name: bundle.name,
            data: { isArchived },
            patch,
          }).unwrap()
        }),
      )

      toast.success(`Bundles ${isArchived ? 'archived' : 'un-archived'}`)
    } catch (error) {
      toast.error('Error archiving bundles')
    }
  }

  const onDelete = async (selected = []) =>
    confirmDelete({
      label: `${selected.length} bundles`,
      accept: async () => {
        try {
          // delete all selected bundles
          await Promise.all(selected.map((name) => deleteBundle({ name }).unwrap()))

          // clear selection on successful delete
          onBundleSelect([])
        } catch (error) {
          console.error(error)
          toast.error('Error deleting bundles')
        }
      },
    })

  const getBundleStatusItem = (status, bundle, disabledExtra) => {
    const key = 'is' + status.charAt(0).toUpperCase() + status.slice(1)
    const setLabel = 'Set ' + status
    const unsetLabel = 'Unset ' + status
    const isStatus = bundle[key]
    const label = isStatus ? unsetLabel : setLabel
    const icon = isStatus ? 'remove' : 'add'
    const command = () => toggleBundleStatus(status, bundle.name)
    const disabled = selectedBundles.length > 1 || disabledExtra
    return { label, icon, command, disabled }
  }

  const [ctxMenuShow] = useCreateContextMenu([])

  const onContextMenu = (e) => {
    // get selection and if it's changed or not
    let newSelection = selectedBundles

    if (e?.data?.name && !selectedBundles?.includes(e.data.name)) {
      // if the selection does not include the clicked node, new selection is the clicked node
      newSelection = [e.data.name]
      // update selection state
      onBundleSelect(newSelection)
    }

    const ctxMenuItems = []
    // active bundle is the bundle that is right clicked on
    // you can only set production, staging, dev status on one bundle at a time
    const activeBundle = e?.data
    if (!activeBundle) return
    const { name: activeBundleName, isArchived, isProduction, isStaging, isDev } = e?.data || {}
    if (!activeBundleName) {
      return
    }
    if (!isArchived) {
      // production
      ctxMenuItems.push(getBundleStatusItem('production', activeBundle, isDev))
      // staging
      ctxMenuItems.push(getBundleStatusItem('staging', activeBundle, isDev))
      // dev
      if (developerMode)
        ctxMenuItems.push(getBundleStatusItem('dev', activeBundle, isProduction || isStaging))
    }

    // duplicate and edit
    ctxMenuItems.push({
      label: 'Duplicate and Edit',
      icon: 'edit_document',
      shortcut: 'Shift+D',
      command: () => onDuplicate(activeBundleName),
      disabled: selectedBundles.length > 1,
    })

    const resolveCanCopySettings = () => {
      const devAvailable = hasDevBundles && developerMode
      // Check if the selected bundle has staging status and there is a production bundle available
      const noProd = isStaging && !prodBundleName && !devAvailable

      // Check if the selected bundle has production status and there is a staging bundle available
      const noStag = isProduction && !stagingBundleName && !devAvailable

      // bundle is not production or staging or dev
      const notActive = !isProduction && !isStaging && !isDev

      // it is both production and staging
      const isBoth = isProduction && isStaging

      return selectedBundles.length > 1 || noProd || noStag || notActive || isBoth
    }

    ctxMenuItems.push({
      label: 'Copy settings from...',
      icon: 'system_update_alt',
      command: () => onCopySettings(activeBundle),
      disabled: resolveCanCopySettings(),
    })

    const newSelectedBundles = bundleList.filter((b) => newSelection.includes(b.name))

    // count number of isArchived newSelectedBundles
    const numNotArchived = newSelectedBundles.filter((b) => !b.isArchived).length
    // set to archive if at least one is not archived
    const isArchiving = numNotArchived > 0

    // duplicate and edit
    ctxMenuItems.push({
      label: isArchiving ? 'Archive' : 'Unarchive',
      icon: isArchiving ? 'archive' : 'unarchive',
      command: () => onArchive(newSelectedBundles, isArchiving),
      disabled: isStaging || isProduction,
    })

    const metaKey = e.originalEvent.metaKey || e.originalEvent.ctrlKey

    // check all are archived
    const allArchived = newSelectedBundles.every((b) => b.isArchived)

    if (metaKey || isArchived) {
      // secret delete bundle
      ctxMenuItems.push({
        label: 'Delete',
        icon: 'delete',
        command: () => onDelete(newSelection),
        disabled: isStaging || isProduction || (!allArchived && !metaKey),
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
        {rowData.isProduction && (
          <Badge hl="production" data-testid={`${rowData.name}-production`}>
            Production
          </Badge>
        )}
        {rowData.isStaging && (
          <Badge hl="staging" data-testid={`${rowData.name}-staging`}>
            Staging
          </Badge>
        )}
        {rowData.isDev && (
          <Badge hl="developer" data-testid={`${rowData.name}-dev`}>
            Dev{rowData.activeUser && ` (${rowData.activeUser})`}
          </Badge>
        )}
      </BadgeWrapper>
    )
  }

  const handleSelect = (e) => {
    const selected = e.value.map((b) => b.name)
    onBundleSelect(selected)
  }

  const tableData = useTableLoadingData(sortedBundleList, isLoading, 10, 'name')

  return (
    <TablePanel>
      <DataTable
        value={tableData}
        scrollable
        scrollHeight="flex"
        selectionMode="multiple"
        responsive="true"
        dataKey="name"
        onContextMenu={onContextMenu}
        selection={selectedBundles.map((name) => ({ name }))}
        onSelectionChange={handleSelect}
        className={clsx('bundles-table', { loading: isLoading })}
        rowClassName={(rowData) => ({ archived: rowData?.isArchived, loading: isLoading })}
        resizableColumns
        emptyMessage={errorMessage ? 'Error: ' + errorMessage : 'No bundles found'}
      >
        <Column
          field="name"
          header="Name"
          body={(b) => `${b.name} ${b?.isArchived ? '(archived)' : ''}`}
        />
        <Column header="Status" body={formatStatus} style={{ maxWidth: 130 }} />
      </DataTable>
    </TablePanel>
  )
}

export default BundleList
