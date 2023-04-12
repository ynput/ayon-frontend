import ayonClient from '/src/ayon'
import { useMemo } from 'react'
import { Section, TablePanel } from 'ayon-react-components-test'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

const SiteList = ({ value, onChange, style, multiselect = false }) => {
  const selection = useMemo(() => {
    if (multiselect)
      return ayonClient.settings.sites.filter((site) => (value || []).includes(site.id))

    // single selection
    return ayonClient.settings.sites.find((site) => site.id === value)
  }, [value, multiselect])

  const onSelectionChange = (e) => {
    if (multiselect) {
      const newSelection = e.value.map((site) => site.id)
      onChange(newSelection)
    } else {
      onChange(e.value?.id)
    }
  }

  return (
    <Section style={style}>
      <TablePanel>
        <DataTable
          value={ayonClient.settings.sites}
          scrollable="true"
          scrollHeight="flex"
          selectionMode="multiple"
          responsive="true"
          dataKey="id"
          selection={selection}
          onSelectionChange={onSelectionChange}
          emptyMessage="No sites found"
        >
          <Column field="id" header="Site ID" />
          <Column field="platform" header="Platform" />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default SiteList
