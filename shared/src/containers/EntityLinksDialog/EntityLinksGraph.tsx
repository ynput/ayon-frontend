import { FC, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { Icon, theme } from '@ynput/ayon-react-components'
import { groupLinksByEntity } from '@shared/components/LinksManager/utils/groupLinks'
import type { EntityLinkGroup } from './groupEntityLinks'
import type { LinkedEntityRef } from './EntityLinksPanel'

// Read-only graph of one entity's links: inputs on the left, the entity in
// the middle, outputs on the right. Nodes are HTML over an SVG with the edges.

const NODE_W = 240
const NODE_H = 40
const GAP = 8
const CENTER_W = 200
const CENTER_H = 56
const PAD = 12
const DEFAULT_COLOR = 'var(--md-sys-color-outline)'

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

const Scroller = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-low);
`

const Canvas = styled.div`
  position: relative;
  min-width: 100%;

  svg {
    position: absolute;
    inset: 0;
    overflow: visible;
    pointer-events: none;
  }
  path {
    fill: none;
    transition: opacity 0.1s, stroke-width 0.1s;
  }
`

const Node = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  box-sizing: border-box;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);
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
    direction: rtl;
    text-align: left;
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

type GraphNode = {
  key: string
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

const buildNodes = (groups: EntityLinkGroup[], direction: 'in' | 'out'): GraphNode[] =>
  groups
    .filter((g) => g.direction === direction && g.links.length)
    .flatMap((g) =>
      groupLinksByEntity(g.links).map((l) => ({
        key: `${g.key}:${l.groupKey}`,
        direction,
        entityId: l.entityId,
        entityType: l.representative.entityType,
        label: l.representative.label,
        parents: l.representative.parents,
        icon: l.representative.icon,
        iconColor: l.representative.color,
        count: l.count,
        restricted: !!l.representative.isRestricted,
        linkType: g.linkType,
        color: g.color || DEFAULT_COLOR,
      })),
    )

const markerId = (color: string) => `links-graph-arrow-${color.replace(/[^a-zA-Z0-9]/g, '')}`

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

export const EntityLinksGraph: FC<EntityLinksGraphProps> = ({
  groups,
  entityType,
  name,
  icon,
  iconColor,
  isManager,
  isLoading,
  onOpenEntity,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)

  const inNodes = useMemo(() => buildNodes(groups, 'in'), [groups])
  const outNodes = useMemo(() => buildNodes(groups, 'out'), [groups])
  const hasNodes = inNodes.length + outNodes.length > 0

  // the scroller only exists once there is something to draw
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    setWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [hasNodes])

  const legend = useMemo(() => {
    const map = new Map<string, { color: string; count: number }>()
    for (const n of [...inNodes, ...outNodes]) {
      const entry = map.get(n.linkType) || { color: n.color, count: 0 }
      entry.count += n.count
      map.set(n.linkType, entry)
    }
    return [...map.entries()]
  }, [inNodes, outNodes])

  if (isLoading) return <Empty>Loading links…</Empty>
  if (!hasNodes) return <Empty>No links</Empty>

  // columns shrink on narrow dialogs, the centre keeps its size
  const colW = Math.max(140, Math.min(NODE_W, (width - CENTER_W - 4 * PAD) / 2 - 40))
  const rows = Math.max(inNodes.length, outNodes.length, 1)
  const height = Math.max(rows * (NODE_H + GAP) - GAP, CENTER_H) + 2 * PAD
  const centerX = (width - CENTER_W) / 2
  const centerY = (height - CENTER_H) / 2
  const leftX = PAD
  const rightX = width - PAD - colW

  // stack each column around the middle so short columns do not hug the top
  const columnTop = (count: number) => (height - (count * (NODE_H + GAP) - GAP)) / 2
  const nodeY = (n: GraphNode, i: number) =>
    columnTop(n.direction === 'in' ? inNodes.length : outNodes.length) + i * (NODE_H + GAP)

  const edgePath = (n: GraphNode, i: number) => {
    const y = nodeY(n, i) + NODE_H / 2
    const cy = centerY + CENTER_H / 2
    if (n.direction === 'in') {
      const x1 = leftX + colW
      const x2 = centerX
      const dx = (x2 - x1) / 2
      return `M ${x1} ${y} C ${x1 + dx} ${y}, ${x2 - dx} ${cy}, ${x2} ${cy}`
    }
    const x1 = centerX + CENTER_W
    const x2 = rightX
    const dx = (x2 - x1) / 2
    return `M ${x1} ${cy} C ${x1 + dx} ${cy}, ${x2 - dx} ${y}, ${x2} ${y}`
  }

  const colors = [...new Set([...inNodes, ...outNodes].map((n) => n.color))]

  const renderNode = (n: GraphNode, i: number) => {
    const clickable = !n.restricted
    const label = n.restricted ? (isManager ? 'Unknown' : 'Access restricted') : n.label
    return (
      <Node
        key={n.key}
        className={clickable ? 'clickable' : 'restricted'}
        style={{
          left: n.direction === 'in' ? leftX : rightX,
          top: nodeY(n, i),
          width: colW,
          height: NODE_H,
          borderLeftColor: n.color,
        }}
        onMouseEnter={() => setHovered(n.key)}
        onMouseLeave={() => setHovered(null)}
        onClick={() => clickable && onOpenEntity({ id: n.entityId, entityType: n.entityType })}
        data-tooltip={
          n.restricted
            ? undefined
            : `${n.linkType} ${n.direction === 'in' ? 'input' : 'output'}: ${[
                ...n.parents,
                n.label,
              ].join('/')}`
        }
      >
        <Icon icon={n.icon} className="icon" style={{ color: n.iconColor }} />
        <span className="text">
          <span className="label">{label}</span>
          {!n.restricted && !!n.parents.length && (
            <span className="path">{n.parents.join(' / ')}</span>
          )}
        </span>
        {n.count > 1 && <span className="count">×{n.count}</span>}
      </Node>
    )
  }

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
      <Scroller ref={scrollerRef}>
        {width > 0 && (
          <Canvas style={{ height }}>
            <svg width={width} height={height}>
              <defs>
                {colors.map((c) => (
                  <marker
                    key={c}
                    id={markerId(c)}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: c }} />
                  </marker>
                ))}
              </defs>
              {[inNodes, outNodes].flatMap((column) =>
                column.map((n, i) => (
                  <path
                    key={n.key}
                    d={edgePath(n, i)}
                    markerEnd={`url(#${markerId(n.color)})`}
                    style={{
                      stroke: n.color,
                      strokeWidth: hovered === n.key ? 3 : 1.5,
                      opacity: hovered && hovered !== n.key ? 0.25 : 0.9,
                    }}
                  />
                )),
              )}
            </svg>
            {inNodes.map(renderNode)}
            <Node
              className="center"
              style={{ left: centerX, top: centerY, width: CENTER_W, height: CENTER_H }}
            >
              <Icon icon={icon} className="icon" style={{ color: iconColor }} />
              <span className="text">
                <span className="label">{name}</span>
                <span className="path" style={{ direction: 'ltr' }}>
                  {entityType}
                </span>
              </span>
            </Node>
            {outNodes.map(renderNode)}
          </Canvas>
        )}
      </Scroller>
    </Wrapper>
  )
}
