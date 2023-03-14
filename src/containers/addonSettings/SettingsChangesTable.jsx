import { useEffect, useMemo, useState, useRef } from 'react'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'
import { Section, TablePanel, Button } from '@ynput/ayon-react-components'

const SettingsChangesTable = ({ changes, onRevert }) => {
  const [expandedKeys, setExpandedKeys] = useState({})
  const [selectedKeys, setSelectedKeys] = useState({})
  const [knownAddonKeys, setKnownAddonKeys] = useState({})

  const cm = useRef(null)

  useEffect(() => {
    const newExpandedKeys = {}
    for (const change in changes || {}) {
      if (!(change in knownAddonKeys)) {
        newExpandedKeys[change] = true
      }
    }
    setExpandedKeys((k) => ({ ...k, ...newExpandedKeys }))
    setKnownAddonKeys((k) => ({ ...k, ...newExpandedKeys }))
  }, [changes])

  const changesTree = useMemo(() => {
    let result = []

    for (const addonKey in changes) {
      const [addonName, addonVersion, _siteName, _projectName] = addonKey.split('|')
      const siteName = _siteName === '_' ? null : _siteName
      const projectName = _projectName === '_' ? null : _projectName

      let name = `${addonName} ${addonVersion}`
      if (siteName) name += ` (${siteName})`

      const addonChanges = changes[addonKey]
      const children = addonChanges.map((change) => ({
        key: `${addonKey}|${change.join('|')}`,
        expanded: true,
        data: {
          name: change.join(' / '),
          path: change,
          addonKey: addonKey,
          isKey: true,
        },
      }))

      result.push({
        key: addonKey,
        selectable: false,
        children,
        data: {
          name,
          addonName,
          addonVersion,
          siteName,
          projectName,
        },
      })
    }

    return result
  }, [changes])

  const menu = useMemo(() => {
    let result = []

    if (onRevert) {
      result.push({
        label: 'Revert selected',
        command: () => {
          const result = {}
          for (const addonKey in changes) {
            console.log('Checking', addonKey)

            console.log('changed', addonKey)
            for (const change of changes[addonKey]) {
              const key = `${addonKey}|${change.join('|')}`
              if (key in selectedKeys) {
                if (!(addonKey in result)) result[addonKey] = []
                result[addonKey].push(change)
              }
            }
          }

          onRevert(result)
        },
      })
    }
    return result
  }, [selectedKeys])

  const actionRenderer = (rowData) => {
    if (!rowData.data.isKey) return null
    const delChange = () => {
      onRevert({
        [rowData.data.addonKey]: [rowData.data.path],
      })
    }
    return <Button className="transparent" icon="delete" onClick={delChange} />
  }

  return (
    <Section>
      <TablePanel>
        <ContextMenu model={menu} ref={cm} />
        <TreeTable
          value={changesTree}
          expandedKeys={expandedKeys}
          onToggle={(e) => setExpandedKeys(e.value)}
          selectionMode="multiple"
          selectionKeys={selectedKeys}
          onSelectionChange={(e) => setSelectedKeys(e.value)}
          onContextMenuSelectionChange={(event) => {
            if (!(event.value in selectedKeys)) {
              setSelectedKeys(event.value)
            }
          }}
          onContextMenu={(event) => cm.current.show(event.originalEvent)}
          emptyMessage="No changes"
          scrollable="true"
          scrollHeight="100%"
        >
          <Column header="Name" field="name" expander />
          <Column header="" body={actionRenderer} style={{ width: 28 }} />
        </TreeTable>
      </TablePanel>
    </Section>
  )
}

export default SettingsChangesTable
