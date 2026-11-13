import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Button, Dropdown, Icon, TablePanel } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { copyToClipboard, replaceRoot } from '@shared/util'
import { useLocalStorage } from '@shared/hooks'
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
`

// title row: section title on the left, grouping controls top right
const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  min-height: 32px;

  h4 {
    margin: 0;
  }

  .group-controls {
    display: flex;
    align-items: center;
    gap: var(--base-gap-small);
    margin-left: auto;
    flex-shrink: 0;
  }
`

// compact "Group by" value, matching the products toolbar group by dropdown
const StyledGroupByValue = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  height: 100%;
  padding: 0 8px;
  white-space: nowrap;
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

  /* rows inside a group are indented one more level */
  &.child {
    max-width: calc(100% - 56px);
    font-weight: normal;
  }

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

type GroupBy = 'version' | 'name'

const GROUP_BY_OPTIONS = [
  { value: 'version', label: 'Version', icon: 'layers' },
  { value: 'name', label: 'Representation', icon: 'description' },
]

const CONTEXT_FIELDS = ['folderName', 'productName', 'productType'] as const

const contextPath = (r: RepContext) => [r.folderName, r.productName].filter(Boolean).join(' / ')

// label for a version: only the context that differs between the selected versions, plus its name
const VersionLabel = ({ data, isChild }: { data: any; isChild?: boolean }) => {
  const path = contextPath(data)
  return (
    <StyledGroup
      className={isChild ? 'child' : undefined}
      title={[path, data.versionName].filter(Boolean).join(' · ')}
    >
      {path && <span className="path">{path}</span>}
      <span className="version">{data.versionName}</span>
      {data.productType && <StyledType>{data.productType}</StyledType>}
    </StyledGroup>
  )
}

type Props = {
  entities: DetailsPanelEntityData[]
  // section title; when set, the grouping controls sit on the title row (top right)
  title?: string
}

export const RepresentationsList = ({ entities = [], title }: Props) => {
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

  const [groupBy, setGroupBy] = useLocalStorage<GroupBy>('representationsList-groupBy', 'name')

  const isMultiVersion = useMemo(
    () => new Set(representations.map((rep) => rep.versionId)).size > 1,
    [representations],
  )

  // one version -> flat list; several versions -> grouped by version or by representation name
  const data = useMemo(() => {
    if (!isMultiVersion) return representations.map((rep) => ({ key: rep.id, data: rep }))

    // only keep context fields that differ between the selected versions
    const ownContext = (rep: (typeof representations)[number]) => {
      const own: RepContext = {}
      for (const field of CONTEXT_FIELDS) {
        if (sharedContext?.[field] === undefined) own[field] = rep[field]
      }
      return own
    }

    const groupKey = (rep: (typeof representations)[number]) =>
      (groupBy === 'name' ? rep.name : rep.versionId) || ''
    const groups = new Map<string, typeof representations>()
    for (const rep of representations) {
      const key = groupKey(rep)
      groups.set(key, [...(groups.get(key) || []), rep])
    }

    return [...groups.entries()].map(([key, reps]) => {
      const first = reps[0]
      return {
        key: `group-${groupBy}-${key}`,
        data:
          groupBy === 'name'
            ? { isGroup: true, name: first.name, count: reps.length }
            : { isGroup: true, ...ownContext(first), versionName: first.versionName },
        // grouped by name, each child is a version: label it with what differs between versions
        children: reps.map((rep) => ({
          key: rep.id,
          data:
            groupBy === 'name'
              ? {
                  ...rep,
                  // drop the context shared by all versions; it is already shown above the table
                  folderName: undefined,
                  productName: undefined,
                  productType: undefined,
                  ...ownContext(rep),
                  isVersionRow: true,
                }
              : rep,
        })),
      }
    })
  }, [representations, sharedContext, isMultiVersion, groupBy])

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
      {(title || isGrouped) && (
        <StyledHeader>
          {title && <h4>{title}</h4>}
          {isGrouped && (
            <div className="group-controls">
              <Dropdown
                value={[groupBy]}
                options={GROUP_BY_OPTIONS}
                onChange={(value) => value[0] && setGroupBy(value[0] as GroupBy)}
                align="right"
                valueTemplate={(_value, _selected, isOpen) => (
                  <StyledGroupByValue>
                    <span>Group by</span>
                    <Icon icon={isOpen ? 'expand_less' : 'expand_more'} />
                  </StyledGroupByValue>
                )}
                data-tooltip="Group representations by version or by representation name"
                data-tooltip-delay={0}
              />
              <Button
                variant="text"
                icon={allExpanded ? 'unfold_less' : 'unfold_more'}
                onClick={toggleAll}
                data-tooltip={allExpanded ? 'Collapse all groups' : 'Expand all groups'}
                data-tooltip-delay={0}
              />
            </div>
          )}
        </StyledHeader>
      )}
      {(sharedPath || sharedContext?.productType) && (
        <StyledContext>
          {sharedPath && (
            <span className="path" title={sharedPath}>
              {sharedPath}
            </span>
          )}
          {sharedContext?.productType && <StyledType>{sharedContext.productType}</StyledType>}
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
              const { data } = node
              if (data.isVersionRow) return <VersionLabel data={data} isChild />
              if (!data.isGroup) return data.name
              if (groupBy === 'name')
                return (
                  <StyledGroup title={data.name}>
                    <span className="path">{data.name}</span>
                    <span className="version">{data.count}</span>
                  </StyledGroup>
                )
              return <VersionLabel data={data} />
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
