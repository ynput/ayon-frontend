import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Button, TablePanel } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { copyToClipboard, replaceRoot } from '@shared/util'
import { useCreateContextMenu } from '@shared/containers/ContextMenu/useCreateContextMenu'
import { DetailsDialog } from '@shared/components/DetailsDialog/DetailsDialog'
import versionsToRepresentations from './versionsToRepresentations'
import { useGetProjectAnatomyQuery } from '@shared/api'
import type { DetailsPanelEntityData } from '@shared/api'

const StyledContext = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  min-width: 0;
  padding: 0 var(--padding-s);
  color: var(--md-sys-color-on-surface-variant);

  .path {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .toggle-all {
    margin-left: auto;
    flex-shrink: 0;
  }
`

const StyledType = styled.span`
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface);
  font-size: 12px;
`

const StyledGroup = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--base-gap-small);
  min-width: 0;
  /* leave room for the expand toggler so the path shrinks instead of the whole label */
  max-width: calc(100% - 40px);
  vertical-align: middle;
  font-weight: 500;

  .path {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .version {
    flex-shrink: 0;
    color: var(--md-sys-color-outline);
  }
`

type RepContext = { folderName?: string; productName?: string; productType?: string }

const CONTEXT_FIELDS = ['folderName', 'productName', 'productType'] as const

const contextPath = (r: RepContext) => [r.folderName, r.productName].filter(Boolean).join(' / ')

type Props = {
  entities: DetailsPanelEntityData[]
}

export const RepresentationsList = ({ entities = [] }: Props) => {
  // merge all entities data into one array of entities
  const representations = useMemo(() => versionsToRepresentations(entities) || [], [entities])

  const [showDetail, setShowDetail] = useState<false | string>(false)
  const showDetailProjectName = representations.find((rep) => rep.id === showDetail)?.projectName

  const [selected, setSelected] = useState<string[]>([])

  // folder / product / product type that every representation shares are shown
  // once above the table; only the parts that differ are shown per version group
  const sharedContext = useMemo(() => {
    const first = representations[0]
    if (!first) return null
    const shared: RepContext = {}
    for (const field of CONTEXT_FIELDS) {
      if (representations.every((rep) => rep[field] === first[field])) shared[field] = first[field]
    }
    return shared
  }, [representations])

  // one version -> flat list; several versions -> one group per version
  const data = useMemo(() => {
    const byVersion = new Map<string, typeof representations>()
    for (const rep of representations) {
      const key = rep.versionId || ''
      byVersion.set(key, [...(byVersion.get(key) || []), rep])
    }

    if (byVersion.size <= 1) return representations.map((rep) => ({ key: rep.id, data: rep }))

    return [...byVersion.entries()].map(([versionId, reps]) => {
      const first = reps[0]
      // only keep context fields that differ between the selected versions
      const own: RepContext = {}
      for (const field of CONTEXT_FIELDS) {
        if (sharedContext?.[field] === undefined) own[field] = first[field]
      }
      return {
        key: `group-${versionId}`,
        data: { isGroup: true, ...own, versionName: first.versionName },
        children: reps.map((rep) => ({ key: rep.id, data: rep })),
      }
    })
  }, [representations, sharedContext])

  const isGrouped = data.some((row: any) => row.children)

  // groups start expanded; re-expand when the selection changes
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({})
  useEffect(() => {
    setExpandedKeys(
      Object.fromEntries(data.filter((row: any) => row.children).map((row) => [row.key, true])),
    )
  }, [data])

  const groupKeys = useMemo(
    () => data.filter((row: any) => row.children).map((row) => row.key),
    [data],
  )
  const allExpanded = groupKeys.length > 0 && groupKeys.every((key) => expandedKeys[key])
  const toggleAll = () =>
    setExpandedKeys(allExpanded ? {} : Object.fromEntries(groupKeys.map((key) => [key, true])))

  const sharedPath = sharedContext ? contextPath(sharedContext) : ''

  const onRepSelectionChange = (entityId: string) => {
    // set focused state
    setSelected([entityId])
  }

  const onRowClick = (e: any) => {
    if (e.node.data.isGroup) return
    onRepSelectionChange(e.node.data.id)
  }

  const projectName = representations[0]?.projectName

  const { data: anatomy } = useGetProjectAnatomyQuery(
    { projectName: projectName as string },
    { skip: !projectName },
  )

  const rootsByPlatform = useMemo(() => {
    const roots = anatomy?.roots ?? []
    const build = (platform: 'windows' | 'linux' | 'darwin') =>
      Object.fromEntries(roots.filter((r) => r[platform]).map((r) => [r.name, r[platform]]))
    return { windows: build('windows'), darwin: build('darwin'), linux: build('linux') }
  }, [anatomy])

  const copyRepPath = (id: string, platform: 'windows' | 'darwin' | 'linux') => {
    const rootless = representations.find((rep) => rep.id === id)?.files?.[0]
    if (!rootless) return
    const resolved = replaceRoot(rootless, rootsByPlatform[platform])
    if (!resolved || /\{root\[.*?\]\}/.test(resolved)) return
    copyToClipboard(resolved, true)
  }

  const ctxMenuItems = (id: string) => [
    {
      label: 'Representation detail',
      command: () => setShowDetail(id),
      icon: 'database',
    },
    {
      label: 'Copy path',
      icon: 'content_copy',
      items: [
        { label: 'Copy Windows path', command: () => copyRepPath(id, 'windows') },
        { label: 'Copy Mac path', command: () => copyRepPath(id, 'darwin') },
        { label: 'Copy Linux path', command: () => copyRepPath(id, 'linux') },
      ],
    },
  ]

  const [ctxMenuShow] = useCreateContextMenu([])

  const handleContextMenu = (e: any) => {
    const id = e.node.data.id

    if (id) {
      // update focused representations
      onRepSelectionChange(id)
      // open context menu
      ctxMenuShow(e.originalEvent, ctxMenuItems(id))
    }
  }

  return (
    <>
      {(sharedPath || sharedContext?.productType || isGrouped) && (
        <StyledContext>
          {sharedPath && (
            <span className="path" title={sharedPath}>
              {sharedPath}
            </span>
          )}
          {sharedContext?.productType && <StyledType>{sharedContext.productType}</StyledType>}
          {isGrouped && (
            <Button
              className="toggle-all"
              variant="text"
              icon={allExpanded ? 'unfold_less' : 'unfold_more'}
              onClick={toggleAll}
              data-tooltip={allExpanded ? 'Collapse all versions' : 'Expand all versions'}
              data-tooltip-delay={0}
            />
          )}
        </StyledContext>
      )}
      <TablePanel>
        <TreeTable
          scrollable
          scrollHeight="100%"
          resizableColumns
          columnResizeMode="fit"
          value={data}
          emptyMessage="No representation found"
          selectionMode="single"
          selectionKeys={selected[0]}
          onRowClick={onRowClick}
          onContextMenu={handleContextMenu}
          expandedKeys={expandedKeys}
          onToggle={(e) => setExpandedKeys(e.value as Record<string, boolean>)}
        >
          <Column
            field="name"
            header="Name"
            expander={isGrouped}
            style={{ minWidth: 120 }}
            body={(node: any) => {
              if (!node.data.isGroup) return node.data.name
              const path = contextPath(node.data)
              return (
                <StyledGroup title={[path, node.data.versionName].filter(Boolean).join(' · ')}>
                  {path && <span className="path">{path}</span>}
                  <span className="version">{node.data.versionName}</span>
                  {node.data.productType && <StyledType>{node.data.productType}</StyledType>}
                </StyledGroup>
              )
            }}
          />
          <Column
            field="fileCount"
            header="Files"
            style={{ width: 60 }}
            body={(node: any) => (node.data.isGroup ? null : node.data.fileCount)}
          />
        </TreeTable>
      </TablePanel>

      {showDetail && (
        <DetailsDialog
          projectName={showDetailProjectName}
          entityType={'representation'}
          entityIds={[showDetail]}
          visible={!!showDetail}
          onHide={() => setShowDetail(false)}
        />
      )}
    </>
  )
}
