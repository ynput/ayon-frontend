import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { TablePanel } from '@ynput/ayon-react-components'
import useCreateContext from '/src/hooks/useCreateContext'
import { useUpdateBundleMutation } from '/src/services/bundles'

const BundleList = ({ selectedBundle, setSelectedBundle, bundleList, isLoading }) => {
  const [updateBundle] = useUpdateBundleMutation()

  const onSetProduction = () => {
    updateBundle({ name: selectedBundle, isProduction: true })
  }

  const onSetStaging = () => {
    updateBundle({ name: selectedBundle, isStaging: true })
  }

  const onUnsetProduction = () => {
    updateBundle({ name: selectedBundle, isProduction: false })
  }

  const onUnsetStaging = () => {
    updateBundle({ name: selectedBundle, isStaging: false })
  }

  const ctxMenuItems = []
  if (selectedBundle) {
    if (bundleList.find((b) => b.name === selectedBundle)?.isProduction) {
      ctxMenuItems.push({ label: 'Unset Production', icon: 'cancel', command: onUnsetProduction })
    } else {
      ctxMenuItems.push({ label: 'Set Production', icon: 'check', command: onSetProduction })
    }
    if (bundleList.find((b) => b.name === selectedBundle)?.isStaging) {
      ctxMenuItems.push({ label: 'Unset Staging', icon: 'cancel', command: onUnsetStaging })
    } else {
      ctxMenuItems.push({ label: 'Set Staging', icon: 'check', command: onSetStaging })
    }
  }

  const [ctxMenuShow] = useCreateContext(ctxMenuItems)

  const formatStatus = (rowData) => {
    return (
      <>
        {rowData.isProduction && <span className="p-tag p-tag-success">Production</span>}
        {rowData.isStaging && <span className="p-tag p-tag-info">Staging</span>}
      </>
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
        onContextMenu={(e) => ctxMenuShow(e.originalEvent)}
        selection={{ name: selectedBundle }}
        onSelectionChange={(e) => setSelectedBundle(e.value.name)}
        onContextMenuSelectionChange={(e) => setSelectedBundle(e.value.name)}
      >
        <Column field="name" header="Name" />
        <Column header="" body={formatStatus} />
      </DataTable>
    </TablePanel>
  )
}

export default BundleList
