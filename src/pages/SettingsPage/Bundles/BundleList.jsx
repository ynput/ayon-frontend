import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { TablePanel } from '@ynput/ayon-react-components'

const BundleList = ({ selectedBundle, setSelectedBundle, bundleList, isLoading }) => {
  return (
    <TablePanel loading={isLoading}>
      <DataTable
        value={bundleList}
        scrollable
        scrollHeight="flex"
        selectionMode="single"
        responsive="true"
        dataKey="name"
        selection={{ name: selectedBundle }}
        onSelectionChange={(e) => setSelectedBundle(e.value.name)}
        onContextMenuSelectionChange={(e) => setSelectedBundle(e.value.name)}
      >
        <Column field="name" header="Name" />
      </DataTable>
    </TablePanel>
  )
}

export default BundleList
