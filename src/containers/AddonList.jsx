import { useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Section, TablePanel } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { useGetAddonListQuery } from '/src/services/addonList'
import {
  useSetAddonVersionsMutation,
  useSetCopyAddonVariantMutation,
} from '/src/services/addonList'
import useCreateContext from '../hooks/useCreateContext'

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
      icon: 'move_group',
      disabled: true,
      items: [],
    })

    result.push({
      label: 'From snapshot',
      icon: 'move_group',
      disabled: true,
      items: [],
    })

    result.push({
      label: 'Save snapshot',
      icon: 'save',
      disabled: true,
    })

    return result
  }

  // Set to version

  const versionItems = [
    {
      label: 'Disable ' + environment,
      icon: 'extension_off',
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
    icon: 'layers',
    items: versionItems,
  })

  // Copy from other environment

  if (environment === 'production') {
    result.push({
      label: 'Copy from staging',
      icon: 'move_group',
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
      icon: 'move_group',
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
  const { data, loading } = useGetAddonListQuery()
  const uriChanged = useSelector((state) => state.context.uriChanged)

  // Filter addons by environment
  // add 'version' property to each addon
  const addons = useMemo(() => {
    let result = []
    console.log('With settings: ', withSettings)
    for (const addon of data || []) {
      const envVersion = addon[environment + 'Version']

      if (envVersion || showAllAddons) {
        if (withSettings === 'site') {
          const hasSiteSettings = addon.versions[envVersion]?.hasSiteSettings || false
          if (!hasSiteSettings) {
            continue
          }
        }

        result.push({
          ...addon,
          version: envVersion,
          latestVersion: sortSemver(Object.keys(addon.versions || {})).pop(),
        })
      }
    }
    return result
  }, [data, environment, withSettings, showAllAddons])

  useEffect(() => {
    ///
  }, [changedAddons])

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
    setSelectedAddons(e.value)
  }

  // Context menu
  const contextMenuItems = createContextMenu(
    environment,
    selectedAddons,
    onAddonChanged,
    projectName,
  )

  const [ctxMenuShow] = useCreateContext(contextMenuItems)

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
          onContextMenu={(e) => ctxMenuShow(e.originalEvent)}
        >
          <Column field="title" header="Addon" />
          <Column field="version" header="Version" style={{ maxWidth: 80 }} />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default AddonList
