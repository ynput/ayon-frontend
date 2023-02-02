import { useMemo, useRef, useEffect } from 'react'
import { Section, TablePanel } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'

import { useGetAddonListQuery } from '/src/services/addonList'
import { useSetAddonVersionMutation } from '/src/services/addonList'

const createContextMenu = (environment, selectedAddons) => {
  const [setAddonVersion] = useSetAddonVersionMutation()
  return [
    {
      label: 'Unset ' + environment + ' version',
      command: () => {
        for (const addon of selectedAddons) {
          setAddonVersion({ addonName: addon.name, [environment + 'Version']: null })
        }
      },
    },
  ]
}

const AddonList = ({
  selectedAddons,
  setSelectedAddons,
  changedAddons,
  showAllAddons = true,
  environment = 'production',
  withSettings = 'settings',
}) => {
  const cm = useRef(null)

  const { data, loading } = useGetAddonListQuery()

  // Filter addons by environment
  // add 'version' property to each addon
  const addons = useMemo(() => {
    let result = []
    for (const addon of data || []) {
      if (addon[environment + 'Version'] || showAllAddons) {
        result.push({ ...addon, version: addon[environment + 'Version'] })
      }
    }
    return result
  }, [data, environment, withSettings, showAllAddons])

  useEffect(() => {
    console.log('changedAddons', changedAddons)
  }, [changedAddons])

  // Context menu
  //const menu = useMemo(() => createContextMenu(environment, selectedAddons), [selectedAddons, environment])
  //
  const menu = createContextMenu(environment, selectedAddons)

  return (
    <Section>
      <TablePanel loading={loading}>
        <ContextMenu model={menu} ref={cm} />
        <DataTable
          value={addons}
          selectionMode="multiple"
          scrollable="true"
          scrollHeight="flex"
          selection={selectedAddons}
          onSelectionChange={(e) => setSelectedAddons(e.value)}
          onContextMenu={(e) => cm.current.show(e.originalEvent)}
        >
          <Column field="title" header="Addon" />
          <Column field="version" header="Version" style={{ maxWidth: 80 }} />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default AddonList
