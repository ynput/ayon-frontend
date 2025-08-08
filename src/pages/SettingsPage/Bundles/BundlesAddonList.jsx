import React, { useContext, useEffect, useMemo } from 'react'
import { useListAddonsQuery } from '@shared/api'
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { SocketContext } from '@context/WebsocketContext'
import { compareBuild, coerce, rcompare } from 'semver'
import { Icon, InputSwitch, InputText, VersionSelect } from '@ynput/ayon-react-components'
import { FilePath, LatestIcon } from './Bundles.styled'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const StyledDataTable = styled(DataTable)`
  tr {
    display: flex;
    flex-wrap: nowrap;
    width: 100%;

    th,
    td {
      &:first-child {
        flex: 1;
      }
    }

    td {
      display: flex;
      align-items: center;
    }

    .version-column {
      width: 200px;
    }

    .path-column {
      flex: 1;
    }
  }
`

const AddonListItem = ({ version, setVersion, selection, addons = [], versions }) => {
  const options = useMemo(
    () =>
      selection.length > 1
        ? selection.map((s) => {
            const foundAddon = addons.find((a) => a.name === s.name)
            if (!foundAddon) return ['NONE']
            const versionList = Object.keys(foundAddon.versions || {})
            versionList.sort((a, b) => -1 * compareBuild(a, b))
            return [...versionList, 'NONE']
          })
        : [[...versions.sort((a, b) => -1 * compareBuild(a, b)), 'NONE']],

    [selection, addons],
  )

  return (
    <VersionSelect
      style={{ width: '100%', height: 32 }}
      buttonStyle={{ zIndex: 0 }}
      versions={options}
      value={version ? [version] : []}
      placeholder="NONE"
      onChange={(e) => setVersion(e[0])}
    />
  )
}

const AddonItem = ({ currentVersion, latestVersion }) => {
  const isCurrentLatest = currentVersion === latestVersion
  return (
    <>
      <span>{currentVersion}</span>
      {!isCurrentLatest && (
        <LatestIcon
          data-tooltip-delay={0}
          data-tooltip={'Latest installed version: ' + latestVersion}
          icon="info"
        />
      )}
    </>
  )
}

const BundlesAddonList = React.forwardRef(
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
      onDevChange,
      onAddonAutoUpdate,
    },
    ref,
  ) => {
    const navigate = useNavigate()

    const { data: { addons = [] } = {}, refetch } = useListAddonsQuery({})

    const readyState = useContext(SocketContext).readyState
    useEffect(() => {
      refetch()
    }, [readyState])

    // get production bundle, because
    let { data: { bundles = [] } = {} } = useListBundlesQuery({ archived: true })
    const currentProductionAddons = useMemo(
      () => bundles.find((b) => b.isProduction)?.addons || {},
      [bundles],
    )

    // every time readyState changes, refetch selected addons

    const onSetVersion = (addonName, version, isPipeline) => {
      const versionsToSet = selected.length > 1 ? selected.map((s) => s.name) : [addonName]

      setFormData((prev) => {
        const newFormData = { ...prev }
        const addons = { ...(newFormData.addons || {}) }

        for (const addon of versionsToSet) {
          addons[addon] = version === 'NONE' ? null : version
        }
        newFormData.addons = addons
        return newFormData
      })

      // auto update addon if readOnly and addon.addonType === 'server'
      if (readOnly && isPipeline) {
        onAddonAutoUpdate(addonName, version === 'NONE' ? null : version)
      }
    }

    const addonsTable = useMemo(() => {
      return addons
        .map((addon) => {
          return {
            ...addon,
            version: formData?.addons?.[addon.name] || 'NONE',
            dev: formData?.addonDevelopment?.[addon.name],
          }
        })
        .sort((a, b) => {
          if (
            formData.isProject &&
            a.projectCanOverrideAddonVersion !== b.projectCanOverrideAddonVersion
          ) {
            return a.projectCanOverrideAddonVersion ? -1 : 1
          }
          return a.title.localeCompare(b.title)
        })
    }, [addons, formData])

    const createContextItems = (selected) => {
      let items = [
        {
          label: 'View in Market',
          icon: 'store',
          command: () => navigate(`/market/?selected=${selected.name}`),
        },
      ]

      return items
    }

    const [ctxMenuShow] = useCreateContextMenu([])

    const handleContextClick = (e) => {
      let contextSelection = []
      // is new click not in original selection?
      if (selected.name !== e.data.name) {
        // then update selection to new click
        setSelected(e.data)
        contextSelection = e.data
      } else {
        contextSelection = selected
      }

      ctxMenuShow(e.originalEvent, createContextItems(contextSelection))
    }

    return (
      <StyledDataTable
        value={addonsTable}
        scrollable
        scrollHeight="flex"
        selectionMode="multiple"
        responsive="true"
        dataKey="name"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onContextMenu={handleContextClick}
        tableStyle={{ ...style }}
        className="addons-table"
        rowClassName={(rowData) => diffAddonVersions?.includes(rowData.name) && 'diff-version'}
        ref={ref}
      >
        <Column
          header="Title"
          field="title"
          pt={{
            root: {
              style: {
                height: 38,
                maxWidth: isDev ? 250 : 'unset',
              },
            },
          }}
          sortable
        />
        <Column
          sortable
          field="version"
          header="Version"
          className="version-column"
          body={(addon) => {
            const isPipeline = addon.addonType === 'pipeline'
            const currentVersion = addon.version
            const productionVersion = currentProductionAddons?.[addon.name]
            const allVersions = addon.versions
            const sortedVersions = Object.keys(allVersions).sort((a, b) => {
              const comparison = -1 * compareBuild(coerce(a), coerce(b))
              if (comparison === 0) {
                return b.localeCompare(a)
              }
              return comparison
            })
            const latestVersion = sortedVersions[0]

            if (formData.isProject && !addon.projectCanOverrideAddonVersion) {
              return (
                <span style={{ color: '#666' }}>
                  <Icon icon="lock" /> {productionVersion || 'NONE'}
                </span>
              )
            }

            if (readOnly && isPipeline)
              return <AddonItem latestVersion={latestVersion} currentVersion={currentVersion} />
            // get all selected versions

            const availableVersions = []
            for (const version of Object.keys(addon?.versions || [])) {
              // when we're editing a project bundle,
              // we only show versions that are allowed to be overridden
              if (formData.isProject && !addon.versions[version].projectCanOverrideAddonVersion)
                continue
              availableVersions.push(version)
            }

            return (
              <AddonListItem
                key={addon.name}
                addonTitle={addon.title}
                version={addon.version}
                selection={selected}
                addons={addons}
                setVersion={(version) =>
                  onSetVersion(addon.name, version || null, addon.addonType === 'server')
                }
                versions={availableVersions}
                isDev={isDev}
              />
            )
          }}
        />
        {isDev && (
          <Column
            field="path"
            header="Addon directory"
            className="path-column"
            body={(addon) => (
              <FilePath>
                <InputSwitch
                  checked={addon.dev?.enabled}
                  onChange={() =>
                    onDevChange([addon.name], { value: !addon.dev?.enabled, key: 'enabled' })
                  }
                />
                <InputText
                  value={addon.dev?.path || ''}
                  style={{ width: '100%' }}
                  placeholder="/path/to/dev/addon/client"
                  data-tooltip="Path to the client folder of the addon to run client side code live from source."
                  onChange={(e) =>
                    onDevChange([addon.name], { value: e.target.value, key: 'path' })
                  }
                  disabled={!addon.dev?.enabled}
                />
              </FilePath>
            )}
          />
        )}
      </StyledDataTable>
    )
  },
)

// displayName
BundlesAddonList.displayName = 'BundlesAddonList'

export default BundlesAddonList
