import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { Badge, BadgeWrapper } from '/src/components/Badge'
import { TablePanel } from '@ynput/ayon-react-components'
import useCreateContext from '/src/hooks/useCreateContext'
import { useUpdateBundleMutation } from '/src/services/bundles'

const BundleList = ({ selectedBundle, setSelectedBundle, bundleList, isLoading }) => {
  const [updateBundle] = useUpdateBundleMutation()

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

  const [ctxMenuShow] = useCreateContext([])

  const onContextMenu = (e) => {
    const ctxMenuItems = []
    const activeBundle = e?.data?.name
    if (!activeBundle) {
      return
    }
    if (bundleList.find((b) => b.name === activeBundle)?.isProduction) {
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
    if (bundleList.find((b) => b.name === activeBundle)?.isStaging) {
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
        value={bundleList}
        scrollable
        scrollHeight="flex"
        selectionMode="single"
        responsive="true"
        dataKey="name"
        onContextMenu={(e) => onContextMenu(e)}
        selection={{ name: selectedBundle }}
        onSelectionChange={(e) => setSelectedBundle(e.value.name)}
        onContextMenuSelectionChange={(e) => setSelectedBundle(e.value.name)}
      >
        <Column field="name" header="Name" />
        <Column header="Status" body={formatStatus} style={{ maxWidth: 73 }} />
      </DataTable>
    </TablePanel>
  )
}

export default BundleList
