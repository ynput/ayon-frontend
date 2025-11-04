import { useEffect, useMemo, useState } from 'react'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { Section, TablePanel, Button } from '@ynput/ayon-react-components'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { Badge, BadgeWrapper } from '@shared/components'
import { useURIContext } from '@context/UriContext'

const SettingsChangesTable = ({ changes, unpins, onRevert }) => {
  const [expandedKeys, setExpandedKeys] = useState({})
  const [selectedKeys, setSelectedKeys] = useState({})
  const [knownAddonKeys, setKnownAddonKeys] = useState({})
  const { setUri } = useURIContext()

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
      const [addonName, addonVersion, variant, _siteName, _projectName] = addonKey.split('|')
      const siteName = _siteName === '_' ? null : _siteName
      const projectName = _projectName === '_' ? null : _projectName

      let name = `${addonName} ${addonVersion}`
      if (projectName) name += ` (${projectName})`
      if (siteName) name += ` @${siteName}`

      const addonChanges = changes[addonKey]
      if (!addonChanges?.length) continue

      const addonUnpins = unpins[addonKey] || []

      const children = addonChanges.map((change) => ({
        key: `${addonKey}|${change.join('|')}`,
        expanded: true,
        data: {
          name: change.join(' / '),
          path: change,
          addonKey: addonKey,
          isKey: true,
          isUnpin: addonUnpins.includes(change),
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
          variant,
          siteName,
          projectName,
        },
      })
    }

    return result
  }, [changes, unpins])

  const changeNameRenderer = (rowData) => {
    if (rowData.children) {
      let projectBadge = null
      if (rowData.data.projectName) {
        projectBadge = <Badge color="project" label={rowData.data.projectName} />
      }
      let siteBadge = null
      if (rowData.data.siteName) {
        siteBadge = <Badge color="site" label={rowData.data.siteName} />
      }
      return (
        <div style={{ display: 'inline-flex', flexDirecion: 'row' }}>
          {rowData.data.addonName} {rowData.data.addonVersion}
          <BadgeWrapper>
            <Badge label={rowData.data.variant} />
            {projectBadge}
            {siteBadge}
          </BadgeWrapper>
        </div>
      )
    }

    return rowData.data.path.join(' / ') + (rowData.data.isUnpin ? ' (unpin)' : '')
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

  const [ctxMenuShow] = useCreateContextMenu(ctxMenuItems)

  const actionRenderer = (rowData) => {
    if (!rowData.data.isKey) return null
    const delChange = () => {
      onRevert({
        [rowData.data.addonKey]: [rowData.data.path],
      })
    }
    return <Button variant="text" icon="delete" onClick={delChange} />
  }

  const handleSelectionChange = (e) => {
    if (!(e.value in selectedKeys)) {
      setSelectedKeys(e.value)
    }

    if (Object.keys(e.value).length != 1) return

    for (const addonKey in changes) {
      for (const change of changes[addonKey]) {
        const key = `${addonKey}|${change.join('|')}`
        if (key in selectedKeys) {
          const [addonName, addonVersion, variant, _siteName, _projectName] = addonKey.split('|')
          let uri = `ayon+settings://${addonName}`
          //if (addon.version) uri += `:${addon.version}`
          uri += `/${change.join('/')}`
          if (_projectName && _projectName !== '_') uri += `?project=${_projectName}`
          if (_siteName && _siteName !== '_') uri += `&site=${_siteName}`
          setUri(uri)
          return
        }
      }
    }
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
          onSelectionChange={handleSelectionChange}
          onContextMenuSelectionChange={handleSelectionChange}
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
