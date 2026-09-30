// Read-only React Flow graph of one entity's links: inputs on the left, the
// entity in the middle, outputs on the right. Loaded lazily by
// EntityLinksPanel so @xyflow/react is only fetched when the graph is shown.

import { FC, memo, useMemo, useState } from 'react'
import styled from 'styled-components'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Icon, theme } from '@ynput/ayon-react-components'
import { groupLinksByEntity } from '@shared/components/LinksManager/utils/groupLinks'
import type { EntityLinkGroup } from './groupEntityLinks'
import type { LinkedEntityRef } from './EntityLinksPanel'

const NODE_W = 240
const NODE_H = 40
const GAP_Y = 8
const GAP_X = 120
const COLUMN_GAP = 40
const MAX_ROWS = 12
const CENTER_W = 200
const CENTER_H = 56
const DEFAULT_COLOR = '#8a9199'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-medium);
  flex: 1;
  min-height: 0;
`

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  ${theme.bodySmall}
  color: var(--md-sys-color-outline);

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
`

const FlowBox = styled.div`
  flex: 1;
  min-height: 240px;
  border-radius: var(--border-radius-l);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);

  .react-flow {
    --xy-background-color: transparent;
    --xy-controls-button-background-color: var(--md-sys-color-surface-container);
    --xy-controls-button-background-color-hover: var(--md-sys-color-surface-container-highest);
    --xy-controls-button-color: var(--md-sys-color-on-surface);
    --xy-controls-button-border-color: var(--md-sys-color-outline-variant);
  }
  .react-flow__node {
    cursor: default;
  }
  .react-flow__handle {
    opacity: 0;
    pointer-events: none;
  }
  .react-flow__edge-path {
    transition: opacity 0.1s, stroke-width 0.1s;
  }
`

const Card = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  padding: 0 8px;
  box-sizing: border-box;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-left-width: 3px;
  overflow: hidden;

  &.clickable {
    cursor: pointer;
    &:hover {
      background-color: var(--md-sys-color-surface-container-high-hover);
    }
  }
  &.restricted {
    opacity: 0.6;
    font-style: italic;
  }
  &.center {
    border-left-width: 1px;
    border-color: var(--md-sys-color-primary);
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }

  .icon {
    flex-shrink: 0;
    font-size: 18px;
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .label {
    ${theme.labelLarge}
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .path {
    ${theme.bodySmall}
    color: var(--md-sys-color-outline);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .count {
    ${theme.labelSmall}
    color: var(--md-sys-color-outline);
  }
`

const Empty = styled.div`
  ${theme.bodyMedium}
  color: var(--md-sys-color-outline);
  padding: 24px;
  text-align: center;
`

type LinkNodeData = {
  direction: 'in' | 'out'
  entityId: string
  entityType: string
  label: string
  parents: string[]
  icon: string
  iconColor?: string
  count: number
  restricted: boolean
  linkType: string
  color: string
}

type CenterNodeData = {
  label: string
  entityType: string
  icon: string
  iconColor?: string
}

type LinkNode = Node<LinkNodeData, 'link'>
type CenterNode = Node<CenterNodeData, 'center'>

const LinkNodeView = memo(({ data }: NodeProps<LinkNode>) => (
  <Card
    className={data.restricted ? 'restricted' : 'clickable'}
    style={{ borderLeftColor: data.color }}
    data-tooltip={
      data.restricted
        ? undefined
        : `${data.linkType} ${data.direction === 'in' ? 'input' : 'output'}: ${[
            ...data.parents,
            data.label,
          ].join('/')}`
    }
  >
    {data.direction === 'out' && <Handle type="target" position={Position.Left} />}
    <Icon icon={data.icon} className="icon" style={{ color: data.iconColor }} />
    <span className="text">
      <span className="label">{data.label}</span>
      {!data.restricted && !!data.parents.length && (
        <span className="path">{data.parents.join(' / ')}</span>
      )}
    </span>
    {data.count > 1 && <span className="count">×{data.count}</span>}
    {data.direction === 'in' && <Handle type="source" position={Position.Right} />}
  </Card>
))

const CenterNodeView = memo(({ data }: NodeProps<CenterNode>) => (
  <Card className="center">
    <Handle type="target" position={Position.Left} />
    <Icon icon={data.icon} className="icon" style={{ color: data.iconColor }} />
    <span className="text">
      <span className="label">{data.label}</span>
      <span className="path">{data.entityType}</span>
    </span>
    <Handle type="source" position={Position.Right} />
  </Card>
))

const nodeTypes = { link: LinkNodeView, center: CenterNodeView }

const CENTER_ID = '__center__'

const buildLinkNodes = (
  groups: EntityLinkGroup[],
  direction: 'in' | 'out',
  isManager: boolean,
): LinkNode[] => {
  const list = groups
    .filter((g) => g.direction === direction && g.links.length)
    .flatMap((g) =>
      groupLinksByEntity(g.links).map((l) => ({
        id: `${g.key}:${l.groupKey}`,
        entityId: l.entityId,
        entityType: l.representative.entityType,
        label: l.representative.isRestricted
          ? isManager
            ? 'Unknown'
            : 'Access restricted'
          : l.representative.label,
        parents: l.representative.parents,
        icon: l.representative.icon,
        iconColor: l.representative.color,
        count: l.count,
        restricted: !!l.representative.isRestricted,
        linkType: g.linkType,
        color: g.color || DEFAULT_COLOR,
      })),
    )

  // Long lists wrap into several columns moving away from the centre, each
  // column stacked around y = 0 where the centre node sits.
  const columns = Math.max(1, Math.ceil(list.length / MAX_ROWS))
  const perColumn = Math.ceil(list.length / columns)
  return list.map(({ id, ...data }, i) => {
    const col = Math.floor(i / perColumn)
    const row = i % perColumn
    const inColumn = Math.min(perColumn, list.length - col * perColumn)
    const total = inColumn * (NODE_H + GAP_Y) - GAP_Y
    const offset = GAP_X + col * (NODE_W + COLUMN_GAP)
    return {
      id,
      type: 'link' as const,
      position: {
        x: direction === 'in' ? -(offset + NODE_W) : CENTER_W + offset,
        y: -total / 2 + row * (NODE_H + GAP_Y),
      },
      width: NODE_W,
      height: NODE_H,
      data: { ...data, direction },
    }
  })
}

interface EntityLinksGraphProps {
  groups: EntityLinkGroup[]
  entityType: string
  name: string
  icon: string
  iconColor?: string
  isManager: boolean
  isLoading?: boolean
  onOpenEntity: (entity: LinkedEntityRef) => void
}

const EntityLinksGraph: FC<EntityLinksGraphProps> = ({
  groups,
  entityType,
  name,
  icon,
  iconColor,
  isManager,
  isLoading,
  onOpenEntity,
}) => {
  const [hovered, setHovered] = useState<string | null>(null)

  const linkNodes = useMemo(
    () => [...buildLinkNodes(groups, 'in', isManager), ...buildLinkNodes(groups, 'out', isManager)],
    [groups, isManager],
  )

  const nodes = useMemo<(LinkNode | CenterNode)[]>(
    () => [
      ...linkNodes,
      {
        id: CENTER_ID,
        type: 'center',
        position: { x: 0, y: -CENTER_H / 2 },
        width: CENTER_W,
        height: CENTER_H,
        data: { label: name, entityType, icon, iconColor },
      },
    ],
    [linkNodes, name, entityType, icon, iconColor],
  )

  const edges = useMemo<Edge[]>(
    () =>
      linkNodes.map((n) => {
        const dim = hovered && hovered !== n.id
        return {
          id: `e:${n.id}`,
          source: n.data.direction === 'in' ? n.id : CENTER_ID,
          target: n.data.direction === 'in' ? CENTER_ID : n.id,
          markerEnd: { type: MarkerType.ArrowClosed, color: n.data.color, width: 16, height: 16 },
          style: {
            stroke: n.data.color,
            strokeWidth: hovered === n.id ? 3 : 1.5,
            opacity: dim ? 0.2 : 0.9,
          },
        }
      }),
    [linkNodes, hovered],
  )

  const legend = useMemo(() => {
    const map = new Map<string, { color: string; count: number }>()
    for (const n of linkNodes) {
      const entry = map.get(n.data.linkType) || { color: n.data.color, count: 0 }
      entry.count += n.data.count
      map.set(n.data.linkType, entry)
    }
    return [...map.entries()]
  }, [linkNodes])

  if (isLoading) return <Empty>Loading links…</Empty>
  if (!linkNodes.length) return <Empty>No links</Empty>

  return (
    <Wrapper>
      <Legend>
        {legend.map(([linkType, { color, count }]) => (
          <span key={linkType}>
            <span className="dot" style={{ backgroundColor: color }} />
            {linkType} {count}
          </span>
        ))}
        <span style={{ marginLeft: 'auto' }}>inputs → {entityType} → outputs</span>
      </Legend>
      <FlowBox>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1, minZoom: 0.3 }}
          minZoom={0.2}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          edgesFocusable={false}
          panOnScroll
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
          onNodeMouseEnter={(_, n) => n.type === 'link' && setHovered(n.id)}
          onNodeMouseLeave={() => setHovered(null)}
          onNodeClick={(_, n) => {
            if (n.type !== 'link') return
            const data = n.data as LinkNodeData
            if (!data.restricted) onOpenEntity({ id: data.entityId, entityType: data.entityType })
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#ffffff1a" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </FlowBox>
    </Wrapper>
  )
}

export default EntityLinksGraph
