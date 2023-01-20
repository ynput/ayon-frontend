import axios from 'axios'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Section, TablePanel, Toolbar, Button } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'

const AddonList = ({
  projectKey,
  selectedAddons,
  setSelectedAddons,
  changedAddons,
  onDismissChanges,
  onRemoveOverrides,
  withSettings = 'settings',
}) => {
  const [addons, setAddons] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedNodeKey, setSelectedNodeKey] = useState(null)
  const [showVersions, setShowVersions] = useState(false)
  const cm = useRef(null)

  // Selection
  // selectedAddons state from the parent component stores "data" of the selected addons
  // but for the datatable, we only need keys. the following selectedKeys and onSelectionChange
  // functions are used to convert the data to keys and vice versa.

  const selectedKeys = useMemo(() => {
    const result = {}
    for (const addon of selectedAddons) {
      const prefix = projectKey ? `${projectKey}-` : ''
      const key = `${prefix}${addon.name}@${addon.version}`
      result[key] = true
    }
    return result
  }, [selectedAddons, projectKey])

  const onSelectionChange = (e) => {
    // This nested loop looks a bit weird, but it's necessary
    // to maintain the order of the selected addons as
    // the user selects them.
    let result = []
    for (const key in e.value) {
      for (const rd of addons) {
        if (rd.key === key) {
          result.push(rd.data)
        }
        for (const rd2 of rd.children) {
          if (rd2.key === key) {
            result.push(rd2.data)
          }
        }
      }
    }
    setSelectedAddons(result)
  }

  // Load addons from the server

  useEffect(() => {
    setLoading(true)
    axios
      .get('/api/addons')
      .then((res) => {
        console.log('build tree')
        let result = []
        for (const addon of res.data.addons) {
          const prefix = projectKey ? `${projectKey}-` : ''
          const selectable = addon.productionVersion !== undefined && !showVersions
          const row = {
            key: showVersions
              ? `${prefix}${addon.name}@production`
              : `${prefix}${addon.name}@${addon.productionVersion}`,
            selectable: selectable,
            children: [],
            data: {
              name: addon.name,
              title: addon.title,
              version: showVersions ? '' : addon.productionVersion,
            },
          }

          if (showVersions) {
            for (const version in addon.versions) {
              if (withSettings === 'settings' && !addon.versions[version].hasSettings) continue
              if (withSettings === 'site' && !addon.versions[version].hasSiteSettings) continue

              row.children.push({
                key: `${prefix}${addon.name}@${version}`,
                selectable: true,
                data: {
                  name: addon.name,
                  title: addon.title,
                  version: version,
                  usage:
                    addon.productionVersion === version
                      ? 'Production'
                      : addon.stagingVersion === version
                      ? 'Staging'
                      : '',
                },
              })
            }
            if (!row.children.length) continue
          } // if showVersions
          else {
            if (
              withSettings === 'settings' &&
              !addon.versions[addon.productionVersion]?.hasSettings
            )
              continue
            if (
              withSettings === 'site' &&
              !addon.versions[addon.productionVersion]?.hasSiteSettings
            )
              continue
          }

          result.push(row)
        }
        setAddons(result)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [showVersions, projectKey])

  const menu = useMemo(() => {
    const result = [
      {
        label: 'Remove overrides',
        icon: 'pi pi-times',
        command: () => {
          const [addonName, addonVersion] = selectedNodeKey.split('@')
          onRemoveOverrides(addonName, addonVersion)
        },
      },
      {
        label: 'Dismiss changes',
        icon: 'pi pi-cog',
        disabled: !changedAddons.includes(selectedNodeKey),
        command: () => {
          const [addonName, addonVersion] = selectedNodeKey.split('@')
          onDismissChanges(addonName, addonVersion)
        },
      },
      {
        label: 'Import settings',
        icon: 'pi pi-cog',
        disabled: true,
      },
    ]
    return result
  }, [selectedNodeKey])

  // Add this to the treetable to make multiselect work without
  // ctrl+click:
  // metaKeySelection={false}

  const header = useMemo(
    () => (
      <Toolbar>
        <Button
          checked={showVersions}
          onClick={() => setShowVersions((v) => !v)}
          label={showVersions ? 'Hide all versions' : 'Show all versions'}
        />
      </Toolbar>
    ),
    [showVersions],
  )

  return (
    <Section>
      {header}
      <TablePanel loading={loading}>
        <ContextMenu model={menu} ref={cm} onHide={() => setSelectedNodeKey(null)} />

        <TreeTable
          value={addons}
          selectionMode="multiple"
          scrollable="true"
          scrollHeight="100%"
          selectionKeys={selectedKeys}
          onSelectionChange={onSelectionChange}
          contextMenuSelectionKey={selectedNodeKey}
          onContextMenuSelectionChange={(event) => setSelectedNodeKey(event.value)}
          onContextMenu={(event) => cm.current.show(event.originalEvent)}
          rowClassName={(rowData) => {
            return {
              changed: changedAddons.includes(rowData.key),
              faded: !rowData.selectable,
            }
          }}
        >
          <Column field="title" header="Addon" expander="true" style={{ width: 200 }} />
          <Column field="version" header="Version" />
          <Column field="usage" header="" />
        </TreeTable>
      </TablePanel>
    </Section>
  )
}

export default AddonList
