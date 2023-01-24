import { useState, useMemo, useRef } from 'react'
import { Section, TablePanel } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'

import { useGetAddonListQuery } from '/src/services/addonList'

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
    const result = [
      {
        label: showVersions ? 'Hide non-production versions' : 'Show all versions',
        command: () => setShowVersions(!showVersions),
        icon: 'pi pi-cog',
      },
    ]
    return result
  }, [selectedNodeKey])

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
