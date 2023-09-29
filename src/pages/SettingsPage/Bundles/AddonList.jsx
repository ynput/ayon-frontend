import React, { useContext, useEffect, useMemo } from 'react'
import { StyledVersionSelect } from './Bundles.styled'
import { useGetAddonListQuery } from '../../../services/addons/getAddons'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { SocketContext } from '/src/context/websocketContext'
import { rcompare } from 'semver'
import { InputText } from '@ynput/ayon-react-components'

const AddonListItem = ({ version, setVersion, selection, addons = [], versions, isDev }) => {
  const options = useMemo(
    () =>
      selection.length > 1
        ? selection.map((s) => {
            const foundAddon = addons.find((a) => a.name === s.name)
            if (!foundAddon) return ['NONE']
            const versionList = Object.keys(foundAddon.versions || {})
            versionList.sort((a, b) => rcompare(a, b))
            if (isDev) versionList.push('DEV')
            return [...versionList, 'NONE']
          })
        : [[...versions.sort((a, b) => rcompare(a, b)), ...(isDev ? ['DEV'] : []), 'NONE']],
    [(selection, addons)],
  )

  return (
    <StyledVersionSelect
      style={{ width: 200, height: 32 }}
      buttonStyle={{ zIndex: 0 }}
      versions={options}
      value={version ? [version] : []}
      placeholder="NONE"
      onChange={(e) => setVersion(e[0])}
      className={version === 'DEV' ? 'dev' : ''}
    />
  )
}

const AddonList = React.forwardRef(
  (
    {
      formData,
      setFormData,
      readOnly,
      selected = [],
      setSelected,
      style,
      diffAddonVersions,
      isDev,
    },
    ref,
  ) => {
    const { data: addons = [], refetch } = useGetAddonListQuery({
      showVersions: true,
    })

    const readyState = useContext(SocketContext).readyState
    useEffect(() => {
      refetch()
    }, [readyState])

    // every time readyState changes, refetch selected addons

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

    const onSetPath = (addonName, path) => {
      console.log(addonName, path)
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
          style={{ padding: '8px !important', maxWidth: isDev ? 300 : 'unset' }}
          bodyStyle={{ height: 38 }}
          sortable
        />
        <Column
          sortable
          field="version"
          header="Version"
          style={{ maxWidth: 200 }}
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
                isDev={isDev}
              />
            )
          }}
        />
        {isDev && (
          <Column
            field="path"
            header="File Path"
            body={(addon) =>
              addon.version === 'DEV' ? (
                <InputText
                  value={addon.path}
                  style={{ width: '100%' }}
                  placeholder="/path/to/dev/addon..."
                  onChange={(e) => onSetPath(addon.name, e.target.value)}
                />
              ) : null
            }
          />
        )}
      </DataTable>
    )
  },
)

// displayName
AddonList.displayName = 'AddonList'

export default AddonList
