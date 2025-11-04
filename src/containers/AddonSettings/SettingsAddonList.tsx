import { useMemo, useEffect, useState, FC } from 'react'
import { Section, TablePanel } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { useGetAddonSettingsListQuery } from '@queries/addonSettings'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { useURIContext } from '@shared/context'
import getSettingsStateFromUri from './util/getSettingsSateFromUri'

interface Addon {
  name: string
  title: string
  version: string
  hasSiteSettings?: boolean
  hasProjectSiteSettings?: boolean
  hasProjectSettings?: boolean
  isBroken?: boolean
  hasSettings?: boolean
  key?: string
  variant?: string
  hasProjectSiteOverrides?: boolean
  hasProjectOverrides?: boolean
  hasStudioOverrides?: boolean
}

interface AddonFocusEvent {
  addonName: string
  addonVersion: string
  siteId?: string
  path?: string[]
}

interface SettingsAddonListProps {
  selectedAddons: Addon[]
  setSelectedAddons: (addons: Addon[]) => void
  setBundleName?: (name: string | null) => void
  onContextMenu?: (event: any) => void
  variant?: 'production' | 'staging'
  bundleName?: string | null
  projectBundleName?: string | null
  siteSettings?: boolean
  onAddonFocus?: (event: AddonFocusEvent) => void
  changedAddonKeys?: string[] | null
  projectName?: string
  siteId?: string
}

const SettingsAddonList: FC<SettingsAddonListProps> = ({
  selectedAddons,
  setSelectedAddons,
  setBundleName,
  onContextMenu,
  variant = 'production',
  bundleName = null,
  projectBundleName = null,
  siteSettings = false,
  onAddonFocus = () => {},
  changedAddonKeys = null,
  projectName,
  siteId,
}) => {
  const { data, isLoading, isError } = useGetAddonSettingsListQuery({
    projectName,
    siteId,
    variant,
    bundleName,
    projectBundleName,
  })

  const [preferredSelection, setPreferredSelection] = useState<Addon[]>([])

  // Filter addons by variant
  // add 'version' property to each addon
  const addons = useMemo(() => {
    if (isLoading) return []
    let result: Addon[] = []
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
    const newSelection: Addon[] = []
    for (const addon of addons) {
      if (selectedAddons.find((a) => a.name === addon.name)) {
        newSelection.push(addon)
      } else if (preferredSelection.find((a) => a.name === addon.name)) {
        newSelection.push(addon)
      }
    }
    setSelectedAddons(newSelection)
  }, [addons, preferredSelection])

  useEffect(() => {
    if (!setBundleName) return
    setBundleName(data?.bundleName || null)
  }, [data?.bundleName])

  const { uri } = useURIContext()

  useEffect(() => {
    // if no URI or already have selection, do nothin
    // This is a one time effect
    if (!uri || selectedAddons.length) return
    const { addonName, addonVersion, settingsPath, site } = getSettingsStateFromUri(uri)

    if (addonName) {
      const addon = addons.find(
        (a) => a.name === addonName && (addonVersion ? a.version === addonVersion : true),
      )
      if (addon) {
        setSelectedAddons([addon])
        onAddonFocus({
          addonName,
          addonVersion: addon.version,
          siteId: site,
          path: settingsPath,
        })
      }
    }
  }, [uri, selectedAddons, setSelectedAddons, onAddonFocus])

  const onSelectionChange = (e: any) => {
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

  const rowDataClassNameFormatter = (rowData: Addon) => {
    return clsx({
      changed: changedAddonKeys && rowData.key && changedAddonKeys.includes(rowData.key),
      'broken-addon-row': rowData.isBroken,
      'changed-site': rowData.hasProjectSiteOverrides,
      'changed-project': rowData.hasProjectOverrides,
      'changed-studio': rowData.hasStudioOverrides,
      loading: isLoading,
    })
  }

  let tableData = useTableLoadingData(addons, isLoading, 40)

  if (isError) tableData = []

  const formatVersion = (rowData: Addon) => {
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
          scrollable={true}
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

export default SettingsAddonList
