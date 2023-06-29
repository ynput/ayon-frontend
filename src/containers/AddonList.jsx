import { useMemo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Section, TablePanel } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { useGetAddonListQuery } from '/src/services/addonList'
import sortSemver from '/src/helpers/sortSemver'

const AddonList = ({
  selectedAddons,
  setSelectedAddons,
  environment = 'production', // 'production' or 'staging'
  withSettings = 'settings', // 'settings' or 'site' - show addons with settings or site settings
  onAddonChanged = () => {}, // Triggered when selection is changed by ayon+settings:// uri change
}) => {
  const { data, loading } = useGetAddonListQuery()
  const uriChanged = useSelector((state) => state.context.uriChanged)

  const [preferredSelection, setPreferredSelection] = useState([])

  // Filter addons by environment
  // add 'version' property to each addon
  const addons = useMemo(() => {
    let result = []
    for (const addon of data || []) {
      const envVersion = addon[environment + 'Version']

      if (envVersion) {
        if (withSettings === 'site') {
          const hasSiteSettings = addon.versions[envVersion]?.hasSiteSettings || false
          if (!hasSiteSettings) {
            continue
          }
        }

        result.push({
          ...addon,
          variant: environment,
          version: envVersion,
          latestVersion: sortSemver(Object.keys(addon.versions || {})).pop(),
        })
      }
    }
    return result
  }, [data, environment, withSettings])

  useEffect(() => {
    // Maintain selection when addons are changed due to environment change
    const newSelection = []
    for (const addon of addons) {
      if (selectedAddons.find((a) => a.name === addon.name)) {
        newSelection.push(addon)
      } else if (preferredSelection.find((a) => a.name === addon.name)) {
        newSelection.push(addon)
      }
    }
    setSelectedAddons(newSelection)
  }, [addons])

  useEffect(() => {
    const url = new URL(window.location.href)
    const addonName = url.searchParams.get('addonName')
    const addonVersion = url.searchParams.get('addonVersion')

    if (addonName && addonVersion) {
      const addon = addons.find((a) => a.name === addonName && a.version === addonVersion)
      if (addon) {
        setSelectedAddons([addon])
        onAddonChanged(addonName)
      }
    }
  }, [addons, uriChanged])

  const onSelectionChange = (e) => {
    setPreferredSelection(e.value)
    setSelectedAddons(e.value)
  }

  return (
    <Section style={{ minWidth: 250 }}>
      <TablePanel loading={loading}>
        <DataTable
          value={addons}
          selectionMode="multiple"
          scrollable="true"
          scrollHeight="flex"
          selection={selectedAddons}
          onSelectionChange={onSelectionChange}
        >
          <Column field="title" header="Addon" />
          <Column field="version" header="Version" style={{ maxWidth: 80 }} />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default AddonList
