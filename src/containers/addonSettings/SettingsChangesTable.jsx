import { useEffect, useMemo, useState } from 'react'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { Section, TablePanel } from '@ynput/ayon-react-components'

const SettingsChangesTable = ({ changes }) => {
  const [expandedKeys, setExpandedKeys] = useState({})
  const [selectedKeys, setSelectedKeys] = useState({})
  const [knownAddonKeys, setKnownAddonKeys] = useState({})

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
        },
      }))

      result.push({
        key: addonKey,
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

  return (
    <Section>
      <TablePanel>
        <TreeTable
          value={changesTree}
          expandedKeys={expandedKeys}
          onToggle={(e) => setExpandedKeys(e.value)}
          selectionMode="multiple"
          selectionKeys={selectedKeys}
          onSelectionChange={(e) => setSelectedKeys(e.value)}
          emptyMessage="No changes"
          dataKey="id"
          scrollable="true"
          scrollHeight="100%"
        >
          <Column header="Name" field="name" expander />
        </TreeTable>
      </TablePanel>
    </Section>
  )
}

export default SettingsChangesTable
