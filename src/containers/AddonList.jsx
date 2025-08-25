import { useMemo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Section, TablePanel } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { useGetAddonSettingsListQuery } from '@queries/addonSettings'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'

const AddonList = ({
  selectedAddons,
  setSelectedAddons,
  onContextMenu,
  variant = 'production', // 'production' or 'staging'
  bundleName = null,
  siteSettings = false, // 'settings' or 'site' - show addons with settings or site settings
  onAddonFocus = () => {}, // Triggered when selection is changed by ayon+settings:// uri change
  changedAddonKeys = null, // List of addon keys that have changed
  projectName, // used for changed addons
  siteId, // used for changed addons
}) => {
  const { data, isLoading, isError } = useGetAddonSettingsListQuery({
    projectName,
    siteId,
    variant,
    bundleName,
  })
  const uriChanged = useSelector((state) => state.context.uriChanged)

  const [preferredSelection, setPreferredSelection] = useState([])

  // Filter addons by variant
  // add 'version' property to each addon
  const addons = useMemo(() => {
    if (isLoading) return []
    let result = []
    for (const addon of data?.addons || []) {
      if (siteSettings) {
        if (!projectName && !addon.hasSiteSettings)
          // global site overrides
          continue
        if (projectName && !addon.hasProjectSiteSettings)
          // project site overrides
          continue
      } else if (projectName && !addon.hasProjectSettings && !addon.isBroken) continue
      else if (!addon.hasSettings && !addon.isBroken) continue

      const addonKey = `${addon.name}|${addon.version}|${variant}|${siteId || '_'}|${
        projectName || '_'
      }`

      result.push({
        ...addon,
        key: addonKey,
        variant,
      })
    }

    // sort by addon title
    result.sort((a, b) => a.title.localeCompare(b.title))

    return result
  }, [data, variant, siteSettings])

  useEffect(() => {
    // Maintain selection when addons are changed due to variant change
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

    // additional properties received from ayon+settings:// uri
    const siteId = url.searchParams.get('site') || undefined
    const path = url.searchParams.get('settingsPath')?.split('|') || undefined

    if (addonName) {
      const addon = addons.find(
        (a) => a.name === addonName && (addonVersion ? a.version === addonVersion : true),
      )
      if (addon) {
        setSelectedAddons([addon])
        onAddonFocus({
          addonName,
          addonVersion: addon.version,
          siteId,
          path,
        })
      }
    }
  }, [addons, uriChanged])

  const onSelectionChange = (e) => {
    // if e.value is an array [], just set the selection

    if (Array.isArray(e.value) && e.value?.length) {
      setPreferredSelection(e.value)
      setSelectedAddons(e.value)
      return
    }

    if (e.value?.name) {
      const index = selectedAddons.findIndex((a) => a.name === e.value.name)
      if (index > -1) return
      setSelectedAddons([e.value])
    }
  }

  const rowDataClassNameFormatter = (rowData) => {
    return clsx({
      changed: changedAddonKeys && changedAddonKeys.includes(rowData.key),
      'broken-addon-row': rowData.isBroken,
      'changed-site': rowData.hasProjectSiteOverrides,
      'changed-project': rowData.hasProjectOverrides,
      'changed-studio': rowData.hasStudioOverrides,
      loading: isLoading,
    })
  }

  let tableData = useTableLoadingData(addons, isLoading, 40)

  if (isError) tableData = []

  const formatVersion = (rowData) => {
    let v = rowData.version
    if ((data?.inheritedAddons || []).includes(rowData.name)) v = `${v} (Inherited)`
    return v
  }

  return (
    <Section style={{ minWidth: 250 }}>
      <TablePanel>
        <DataTable
          value={tableData}
          selectionMode="multiple"
          scrollable="true"
          scrollHeight="flex"
          selection={selectedAddons}
          onSelectionChange={onSelectionChange}
          onContextMenuSelectionChange={onSelectionChange}
          onContextMenu={onContextMenu}
          className={clsx('addon-list-table', { loading: isLoading })}
          rowClassName={rowDataClassNameFormatter}
          emptyMessage={isError ? `WARNING: No bundle set to ${variant}` : 'No addons found'}
        >
          <Column field="title" header="Addon" />
          <Column field="version" header="Version" style={{ maxWidth: 110 }} body={formatVersion} />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default AddonList
