import { useEffect, useMemo, useState } from 'react'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { Section, TablePanel, Button } from '@ynput/ayon-react-components'
import useCreateContext from '/src/hooks/useCreateContext'
import { Badge, BadgeWrapper } from '/src/components/Badge'

const SettingsChangesTable = ({ changes, onRevert }) => {
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
      if (projectName) name += ` (${projectName})`
      if (siteName) name += ` @${siteName}`

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

  const changeNameRenderer = (rowData) => {
    if (rowData.children) {
      let projectBadge = null
      if (rowData.data.projectName) {
        projectBadge = <Badge hl="project">{rowData.data.projectName}</Badge>
      }
      let siteBadge = null
      if (rowData.data.siteName) {
        siteBadge = <Badge hl="site">{rowData.data.siteName}</Badge>
      }
      return (
        <div style={{ display: 'inline-flex', flexDirecion: 'row' }}>
          {rowData.data.addonName} {rowData.data.addonVersion}
          <BadgeWrapper>
            {projectBadge}
            {siteBadge}
          </BadgeWrapper>
        </div>
      )
    }

    return rowData.data.path.join(' / ')
  }

  const ctxMenuItems = useMemo(() => {
    let result = []

    if (onRevert) {
      result.push({
        label: 'Clear Selected',
        icon: 'delete',
        command: () => {
          const result = {}
          for (const addonKey in changes) {
            console.log('Checking', addonKey)
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

  const [ctxMenuShow] = useCreateContext(ctxMenuItems)

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
          onContextMenu={(event) => ctxMenuShow(event.originalEvent)}
          emptyMessage="No changes"
          scrollable="true"
          scrollHeight="100%"
        >
          <Column header="Name" body={changeNameRenderer} field="key" expander />
          <Column header="" body={actionRenderer} style={{ width: 28 }} />
        </TreeTable>
      </TablePanel>
    </Section>
  )
}

export default SettingsChangesTable
