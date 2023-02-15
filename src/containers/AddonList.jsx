import { useMemo, useRef, useEffect } from 'react'
import { Section, TablePanel } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'

import { useGetAddonListQuery } from '/src/services/addonList'
import {
  useSetAddonVersionsMutation,
  useSetCopyAddonVariantMutation,
} from '/src/services/addonList'

const sortSemver = (arr) => {
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

const createContextMenu = (environment, selectedAddons, onAddonChanged = () => {}, projectName) => {
  const [setAddonVersions] = useSetAddonVersionsMutation()
  const [setCopyAddonVariant] = useSetCopyAddonVariantMutation()
  const result = []

  if (projectName) {
    result.push({
      label: 'From project',
      icon: 'pi pi-copy',
      disabled: true,
      items: [],
    })

    result.push({
      label: 'From snapshot',
      icon: 'pi pi-copy',
      disabled: true,
      items: [],
    })

    result.push({
      label: 'Save snapshot',
      icon: 'pi pi-save',
      disabled: true,
    })

    return result
  }

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

    const versions = sortSemver(Object.keys(selectedAddons[0].versions)).reverse()

    for (const version of versions) {
      versionItems.push({
        label: version,
        command: () => {
          const versions = { [selectedAddons[0].name]: { [environment + 'Version']: version } }
          setAddonVersions(versions)
        },
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
      command: async () => {
        for (const addon of selectedAddons) {
          try {
            await setCopyAddonVariant({
              addonName: addon.name,
              copyFrom: 'staging',
              copyTo: 'production',
            }).unwrap()
          } catch (e) {
            console.error(e)
          }
          onAddonChanged(addon.name)
        }
      },
    })
  } else {
    result.push({
      label: 'Copy from production',
      command: async () => {
        for (const addon of selectedAddons) {
          try {
            await setCopyAddonVariant({
              addonName: addon.name,
              copyFrom: 'production',
              copyTo: 'staging',
            }).unwrap()
          } catch (e) {
            console.error(e)
          }
          onAddonChanged(addon.name)
        }
      },
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
  projectName,
  showAllAddons = true,
  environment = 'production',
  withSettings = 'settings',
  onAddonChanged = () => {},
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
  const menu = createContextMenu(environment, selectedAddons, onAddonChanged, projectName)

  return (
    <Section style={{ minWidth: 250 }}>
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
