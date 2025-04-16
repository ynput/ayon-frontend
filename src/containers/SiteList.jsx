import ayonClient from '@/ayon'
import { useMemo, useEffect } from 'react'
import { Section, TablePanel } from '@ynput/ayon-react-components'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useLocalStorage } from '@shared/hooks'

const SiteList = ({ value, onChange, style, multiselect = false }) => {
  const [preferredSite, setPreferredSite] = useLocalStorage('prefferedSite', null)
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
      setPreferredSite(newSelection[0])
    } else {
      onChange(e.value?.id)
      setPreferredSite(e.value?.id)
    }
  }

  useEffect(() => {
    if (
      !(multiselect ? value?.length : value) &&
      preferredSite &&
      ayonClient.settings.sites.find((site) => site.id === preferredSite)
    )
      onChange(multiselect ? [preferredSite] : preferredSite)
  }, [preferredSite])

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
