import axios from 'axios'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Section, Panel, TableWrapper } from 'openpype-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'

const AddonList = ({
  selectedAddons,
  setSelectedAddons,
  showVersions,
  changedAddons,
  onDismissChanges,
  onRemoveOverrides,
  header,
  footer,
}) => {
  const [addons, setAddons] = useState({})
  const [selectedNodeKey, setSelectedNodeKey] = useState(null)
  const cm = useRef(null)

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
    axios.get('/api/addons').then((res) => {
      let result = []
      for (const addon of res.data.addons) {
        const row = {
          key: showVersions
            ? `${addon.name}@production`
            : `${addon.name}@${addon.productionVersion}`,
          selectable: !showVersions,
          children: [],
          data: {
            name: addon.name,
            title: addon.title,
            version: showVersions ? '' : addon.productionVersion,
          },
        }

        if (showVersions) {
          for (const version in addon.versions) {
            if (!addon.versions[version].hasSettings) continue
            row.children.push({
              key: `${addon.name}@${version}`,
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
        } // if showVersions

        result.push(row)
      }
      setAddons(result)
    })
  }, [showVersions])

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

  return (
    <Section style={{ maxWidth: 400 }}>
      {header}
      <Panel className="nopad">
        <TableWrapper>
          <ContextMenu
            model={menu}
            ref={cm}
            onHide={() => setSelectedNodeKey(null)}
          />

          <TreeTable
            value={addons}
            selectionMode="multiple"
            selectionKeys={selectedKeys}
            onSelectionChange={onSelectionChange}
            contextMenuSelectionKey={selectedNodeKey}
            onContextMenuSelectionChange={(event) =>
              setSelectedNodeKey(event.value)
            }
            onContextMenu={(event) => cm.current.show(event.originalEvent)}
            rowClassName={(rowData) => {
              return { changed: changedAddons.includes(rowData.key) }
            }}
          >
            <Column field="title" header="Addon" expander="true" />
            <Column field="version" header="Version" />
            <Column field="usage" header="" />
          </TreeTable>
        </TableWrapper>
      </Panel>
      {footer}
    </Section>
  )
}

export default AddonList
