import { useMemo, useRef, useEffect } from 'react'
import { Section, TablePanel } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'

import { useGetAddonListQuery } from '/src/services/addonList'
import { useSetAddonVersionsMutation } from '/src/services/addonList'

function sortSemver(arr) {
  arr.sort(function (a, b) {
    const aParts = a.split('.')
    const bParts = b.split('.')
    const len = Math.max(aParts.length, bParts.length)
    for (let i = 0; i < len; i++) {
      const aPart = aParts[i] || ''
      const bPart = bParts[i] || ''
      if (aPart === bPart) {
        continue
      }
      if (!isNaN(aPart) && !isNaN(bPart)) {
        return parseInt(aPart) - parseInt(bPart)
      }
      return aPart.localeCompare(bPart)
    }
    return 0
  })
  return arr
}

const createContextMenu = (environment, selectedAddons) => {
  const [setAddonVersions] = useSetAddonVersionsMutation()
  const result = []

  // Set to version

  const versionItems = [
    {
      label: 'Disable ' + environment,
      command: () => {
        const versions = {}
        for (const addon of selectedAddons) {
          versions[addon.name] = { [environment + 'Version']: null }
        }
        setAddonVersions(versions)
      },
    },
    {
      label: 'Latest',
      command: () => {
        const versions = {}
        for (const addon of selectedAddons) {
          versions[addon.name] = { [environment + 'Version']: addon.latestVersion }
        }
        setAddonVersions(versions)
      }, // set to latest
    },
  ]

  if (selectedAddons.length === 1) {
    versionItems.push({
      separator: true,
    })

    for (const version in selectedAddons[0].versions || {}) {
      versionItems.push({
        label: version,
        command: () => {},
      })
    }
  }

  result.push({
    label: 'Set version',
    items: versionItems,
  })

  // Copy from other environment

  if (environment === 'production') {
    result.push({
      label: 'Copy from staging',
      command: () => {},
    })
  } else {
    result.push({
      label: 'Copy from production',
      command: () => {},
    })
  }

  return result
}

//
//
//

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
        result.push({
          ...addon,
          version: addon[environment + 'Version'],
          latestVersion: sortSemver(Object.keys(addon.versions || {})).pop(),
        })
      }
    }
    return result
  }, [data, environment, withSettings, showAllAddons])

  useEffect(() => {
    ///
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
