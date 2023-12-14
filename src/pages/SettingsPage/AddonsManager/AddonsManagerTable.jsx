import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import BundleStatus from './BundleStatus/BundleStatus'
import { TablePanel } from '@ynput/ayon-react-components'

const AddonsManagerTable = ({
  header = '',
  field = '',
  selection = [],
  value = [],
  onChange,
  ...props
}) => {
  const tableSelection = value?.filter((d) => selection.includes(d && d[field]))

  return (
    <TablePanel style={{ height: '100%' }}>
      <DataTable
        {...props}
        value={value}
        scrollable
        scrollHeight="flex"
        selectionMode="multiple"
        onSelectionChange={(e) => onChange(e.value?.map((d) => d && d[field]))}
        selection={tableSelection}
      >
        <Column field={field} header={header} sortable />
        <Column
          field="status"
          header={'Status'}
          style={{ minWidth: 90, flex: 0 }}
          headerStyle={{ width: 50 }}
          body={(d) => <BundleStatus statuses={d.status} />}
          sortable
          sortFunction={(event) => {
            // sort by status length
            return event.data.sort((a, b) =>
              event.order === 1
                ? b.status.length - a.status.length
                : a.status.length - b.status.length,
            )
          }}
        />
      </DataTable>
    </TablePanel>
  )
}

export default AddonsManagerTable
