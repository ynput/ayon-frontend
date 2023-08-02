import React, { useMemo } from 'react'
import { VersionSelect } from '@ynput/ayon-react-components'
import { useGetAddonListQuery } from '/src/services/addonList'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

const AddonListItem = ({ version, setVersion, selection, addons = [], versions }) => {
  const options = useMemo(
    () =>
      selection.length > 1
        ? selection.map((s) => {
            const foundAddon = addons.find((a) => a.name === s.name)
            if (!foundAddon) return ['NONE']
            const versionList = Object.keys(foundAddon.versions || {})
            return [...versionList, 'NONE']
          })
        : [[...versions, 'NONE']],

    [selection, addons],
  )

  return (
    <VersionSelect
      style={{ width: 200 }}
      buttonStyle={{ zIndex: 0 }}
      versions={options}
      value={version ? [version] : []}
      placeholder="NONE"
      onChange={(e) => setVersion(e[0])}
    />
  )
}

const AddonList = React.forwardRef(
  (
    { formData, setFormData, readOnly, selected = [], setSelected, style, diffAddonVersions },
    ref,
  ) => {
    const { data: addons = [] } = useGetAddonListQuery({ showVersions: true })

    const onSetVersion = (addonName, version) => {
      const versionsToSet = selected.length > 1 ? selected.map((s) => s.name) : [addonName]

      setFormData((prev) => {
        const newFormData = { ...prev }
        const addons = { ...(newFormData.addons || {}) }

        for (const addon of versionsToSet) {
          addons[addon] = version === 'NONE' ? undefined : version
        }
        newFormData.addons = addons
        return newFormData
      })
    }

    const addonsTable = useMemo(() => {
      return addons.map((addon) => {
        return {
          ...addon,
          version: formData?.addons?.[addon.name] || 'NONE',
        }
      })
    }, [addons, formData])

    return (
      <DataTable
        value={addonsTable}
        scrollable
        scrollHeight="flex"
        selectionMode="multiple"
        responsive="true"
        dataKey="name"
        // onContextMenu={(e) => onContextMenu(e)}
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onContextMenuSelectionChange={(e) => setSelected(e.value)}
        tableStyle={{ marginBottom: 80, ...style }}
        className="addons-table"
        rowClassName={(rowData) => diffAddonVersions?.includes(rowData.name) && 'diff-version'}
        ref={ref}
      >
        <Column
          header="Name"
          field="name"
          style={{ padding: '8px !important' }}
          bodyStyle={{ height: 38 }}
          sortable
        />
        <Column
          sortable
          field="version"
          header="Version"
          style={{ maxWidth: 120 }}
          bodyStyle={{ padding: 8 }}
          body={(addon) => {
            if (readOnly) return formData?.addons?.[addon.name] || 'NONE'
            // get all selected versions
            return (
              <AddonListItem
                key={addon.name}
                addonTitle={addon.title}
                version={addon.version}
                selection={selected}
                addons={addons}
                setVersion={(version) => onSetVersion(addon.name, version)}
                versions={Object.keys(addon.versions || {})}
              />
            )
          }}
        />
      </DataTable>
    )
  },
)

// displayName
AddonList.displayName = 'AddonList'

export default AddonList
