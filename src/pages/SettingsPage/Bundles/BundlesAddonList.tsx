import React, { useEffect, useMemo } from 'react'
import { useListAddonsQuery } from '@shared/api'
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useSocketContext } from '@shared/context'
import { compareBuild, coerce } from 'semver'
import { Icon, InputSwitch, InputText, VersionSelect } from '@ynput/ayon-react-components'
import { FilePath, LatestIcon } from './Bundles.styled'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import type { Addon as SharedAddon } from './types'

type VersionsMap = Record<string, { projectCanOverrideAddonVersion?: boolean }>

type Addon = {
  name: string
  title: string
  addonType: 'pipeline' | 'server' | string
  versions: VersionsMap
  projectCanOverrideAddonVersion?: boolean
}

type BundleFormData = {
  name?: string
  isProject?: boolean
  isDev?: boolean
  activeUser?: string
  addons?: Record<string, string | null>
  addonDevelopment?: Record<string, { enabled?: boolean; path?: string }>
}

type BundlesAddonListProps = {
  formData: BundleFormData
  setFormData: React.Dispatch<React.SetStateAction<BundleFormData>>
  readOnly?: boolean
  selected?: SharedAddon[] | any[]
  setSelected: (sel: any) => void
  style?: React.CSSProperties
  diffAddonVersions?: string[]
  isDev?: boolean
  onDevChange?: (addonNames: string[], payload: { value: any; key: 'enabled' | 'path' }) => void
  onAddonAutoUpdate?: (addon: string, version: string | null) => void
}

const StyledDataTable = styled(DataTable as unknown as React.FC<any>)`
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

const AddonListItem: React.FC<{
  version?: string | null
  setVersion: (v: string | null) => void
  selection: any[] | any
  addons?: Addon[]
  versions: string[]
  isDev?: boolean
  addonName: string
}> = ({ version, setVersion, selection, addons = [], versions, addonName }) => {
  const options = useMemo(() => {
    // Normalize selection to always be an array
    const selectionArray = Array.isArray(selection) ? selection : [selection]
    const isCurrentAddonSelected = selectionArray.some((s) => s?.name === addonName)

    return selectionArray.length > 1 && isCurrentAddonSelected
      ? selectionArray.map((s) => {
          const foundAddon = addons.find((a) => a.name === s.name)
          if (!foundAddon) return ['NONE']
          const versionList = Object.keys(foundAddon.versions || {})
          versionList.sort((a, b) => -1 * compareBuild(a, b))
          return [...versionList, 'NONE']
        })
      : [[...versions.sort((a, b) => -1 * compareBuild(a, b)), 'NONE']]
  }, [selection, addons, addonName, versions])

  return (
    <VersionSelect
      style={{ width: '100%', height: 32 }}
      buttonStyle={{ zIndex: 0 }}
      versions={options}
      value={version ? [version] : []}
      placeholder="NONE"
      onChange={(e: string[]) => setVersion(e[0] || null)}
    />
  )
}

const AddonItem: React.FC<{ currentVersion?: string | null; latestVersion?: string }> = ({
  currentVersion,
  latestVersion,
}) => {
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

const BundlesAddonList = React.forwardRef<any, BundlesAddonListProps>(
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

    const { data: { addons = [] } = {}, refetch } = useListAddonsQuery({}) as any

    const readyState = useSocketContext().readyState
    useEffect(() => {
      refetch()
    }, [readyState])

    // get production bundle, because
    let { data: { bundles = [] } = {} } = useListBundlesQuery({ archived: true }) as any
    const currentProductionAddons = useMemo(
      () => (bundles as any[]).find((b: any) => b.isProduction)?.addons || {},
      [bundles],
    )

    // every time readyState changes, refetch selected addons

    const onSetVersion = (addonName: string, version: string | null, isServer: boolean) => {
      // Normalize selected to always be an array
      const selectedArray = Array.isArray(selected) ? selected : [selected]
      const versionsToSet: string[] =
        selectedArray.length > 1 ? selectedArray.map((s: any) => s.name) : [addonName]

      setFormData((prev) => {
        const newFormData: BundleFormData = { ...prev }
        const addons: Record<string, string | null> = { ...(newFormData.addons || {}) }

        for (const addon of versionsToSet) {
          addons[addon] = version === 'NONE' ? null : version
        }
        newFormData.addons = addons
        return newFormData
      })

      // auto update addon if readOnly and addon.addonType === 'server'
      if (readOnly && isServer && onAddonAutoUpdate) {
        onAddonAutoUpdate(addonName, version === 'NONE' ? null : version)
      }
    }

    const addonsTable = useMemo(() => {
      return (addons as Addon[])
        .map((addon) => ({
          ...addon,
          version: formData?.addons?.[addon.name] || 'NONE',
          dev: formData?.addonDevelopment?.[addon.name] as { enabled?: boolean; path?: string },
        }))
        .sort((a, b) => {
          // In comparison mode (readOnly), always sort by title only to ensure alignment
          if (readOnly) {
            return a.title.localeCompare(b.title)
          }
          // In edit mode for project bundles, sort by override permission first
          if (
            formData.isProject &&
            a.projectCanOverrideAddonVersion !== b.projectCanOverrideAddonVersion
          ) {
            return a.projectCanOverrideAddonVersion ? -1 : 1
          }
          return a.title.localeCompare(b.title)
        })
    }, [addons, formData, readOnly])

    const createContextItems = (selected: any) => {
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

    const handleContextClick = (e: any) => {
      let contextSelection: any = []
      // is new click not in original selection?
      if ((selected as any)?.name !== e.data.name) {
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
        onSelectionChange={(e: any) => setSelected(e.value)}
        onContextMenu={handleContextClick}
        tableStyle={{ ...style }}
        className="addons-table"
        rowClassName={(rowData: any) => diffAddonVersions?.includes(rowData.name) && 'diff-version'}
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
          body={(addon: any) => {
            const isPipeline = addon.addonType === 'pipeline'
            const currentVersion = addon.version
            const productionVersion = currentProductionAddons?.[addon.name]
            const allVersions = addon.versions
            const sortedVersions = Object.keys(allVersions).sort((a, b) => {
              const comparison = -1 * compareBuild(coerce(a) ?? a, coerce(b) ?? b)
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
                version={addon.version}
                selection={selected}
                addons={addons}
                setVersion={(version) =>
                  onSetVersion(addon.name, version || null, addon.addonType === 'server')
                }
                versions={availableVersions}
                isDev={isDev}
                addonName={addon.name}
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
                    onDevChange &&
                    onDevChange([addon.name], { value: !addon.dev?.enabled, key: 'enabled' })
                  }
                />
                <InputText
                  value={addon.dev?.path || ''}
                  style={{ width: '100%' }}
                  placeholder="/path/to/dev/addon/client"
                  data-tooltip="Path to the client folder of the addon to run client side code live from source."
                  onChange={(e) =>
                    onDevChange && onDevChange([addon.name], { value: e.target.value, key: 'path' })
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
