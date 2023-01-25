import { useState, useMemo, useRef } from 'react'
import { Section, TablePanel } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'

import { useGetAddonListQuery } from '/src/services/addonList'
import { useSetAddonVersionMutation } from '/src/services/addonList'

const AddonList = ({
  selectedAddons,
  setSelectedAddons,
  changedAddons,
  withSettings = 'settings',
}) => {
  const [selectedNodeKey, setSelectedNodeKey] = useState(null)
  const [showVersions, setShowVersions] = useState(false)
  const cm = useRef(null)

  const { data: addons, loading } = useGetAddonListQuery({ showVersions, withSettings })
  const [setAddonVersion] = useSetAddonVersionMutation()

  // Selection
  // selectedAddons state from the parent component stores "data" of the selected addons
  // but for the datatable, we only need keys. the following selectedKeys and onSelectionChange
  // functions are used to convert the data to keys and vice versa.

  const selectedKeys = useMemo(() => {
    const result = {}
    for (const addon of selectedAddons) {
      const key = `${addon.name}@${addon.version}`
      result[key] = true
    }
    return result
  }, [selectedAddons])

  const onSelectionChange = (e) => {
    // This nested loop looks a bit weird, but it's necessary
    // to maintain the order of the selected addons as
    // the user selects them.
    let result = []
    console.log('onSelectionChange', e.value)
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

  const menu = useMemo(() => {
    let result = [
      {
        label: showVersions ? 'Hide unused versions' : 'Show all versions',
        command: () => setShowVersions(!showVersions),
        icon: 'pi pi-cog',
      },
    ]

    if (showVersions && selectedAddons.length === 1) {
      const addon = selectedAddons[0]

      if (addon.version === addon.productionVersion) {
        result.push({
          label: 'Unset production version',
          command: () => {
            setAddonVersion({
              addonName: addon.name,
              productionVersion: null,
              stagingVersion: addon.stagingVersion,
            })
          },
        })
      } else {
        result.push({
          label: 'Set as production version',
          command: () => {
            setAddonVersion({
              addonName: addon.name,
              productionVersion: addon.version,
              stagingVersion: addon.stagingVersion,
            })
          },
        })
      }

      if (addon.version === addon.stagingVersion) {
        result.push({
          label: 'Unset staging version',
          command: () => {
            setAddonVersion({
              addonName: addon.name,
              productionVersion: addon.productionVersion,
              stagingVersion: null,
            })
          },
        })
      } else {
        result.push({
          label: 'Set as staging version',
          command: () => {
            setAddonVersion({
              addonName: addon.name,
              productionVersion: addon.productionVersion,
              stagingVersion: addon.version,
            })
          },
        })
      }
    } // Show additional ctx menu items for set/unset production/staging

    return result
  }, [selectedNodeKey, showVersions, { ...selectedAddons }])

  return (
    <Section>
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
