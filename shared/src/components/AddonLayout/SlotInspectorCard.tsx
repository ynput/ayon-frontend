// The slot inspector's card: what the contribution (or menu button) under the pointer is: the slot's
// id, where the slot comes from and the contribution. It sits at the element's top-right corner,
// stays while the pointer is on the element or on it, and copies a prompt for an AI coding
// assistant: add a contribution to the slot, or edit this one.
// SlotInspectorMenu renders it, so it shows wherever that menu is (AYON's header in developer
// mode, the addon dev shell). Internal, like slotInspector.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'
import type { IconType } from '@ynput/ayon-react-components'
import { getRegistry, isExample, slotInfo } from '@ynput/ayon-addon/host'
import { safeWriteClipboard } from '../../util/clipboardUtils'
import {
  AYON_ADDON,
  SLOT_CARD_ATTRIBUTE,
  addonColor,
  releaseInspected,
  useInspectedElement,
} from './slotInspector'

const GAP = 4

const Card = styled.div`
  position: fixed;
  z-index: 100000;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: max-content;
  max-width: 320px;
  padding: 8px 12px;
  border-radius: var(--border-radius-l);
  border: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface);
  box-shadow: 0 4px 16px rgb(0 0 0 / 40%);
  font-size: 12px;
  line-height: 16px;
  text-align: left;
  white-space: normal;
  cursor: default;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  .copy {
    visibility: hidden;
    padding: 2px;
    min-height: 0;
  }
  &:hover .copy,
  .copy:focus-visible {
    visibility: visible;
  }
`

const Swatch = styled.span`
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
`

const SlotId = styled.code`
  font-family: monospace;
  font-size: 14px;
  font-weight: 600;
  word-break: break-all;
`

const Badge = styled.span`
  margin-left: auto;
  padding: 0 6px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-outline);
  font-size: 11px;
`

const Code = styled.code`
  font-family: monospace;
  word-break: break-all;
`

const Muted = styled.span`
  color: var(--md-sys-color-outline);
`

const Actions = styled.div`
  display: flex;
  margin-top: 4px;

  button {
    gap: 4px;
    padding: 2px 8px;
    min-height: 0;
    font-size: 12px;
  }
`

interface Inspected {
  slot: string
  /** the addon that declared the slot; none for AYON's */
  owner?: { name: string; version: string }
  /** a rendered contribution: its addon and key, and whether it is the slot's example */
  contribution?: { addon: string; key: string; example: boolean }
  /** a button that opens a menu with the slot's contributions: their addons */
  menuOf?: string[]
}

const describe = (element: Element): Inspected | undefined => {
  const slot = element.getAttribute('data-ayon-slot')
  if (!slot) return undefined
  const { owner } = slotInfo(slot)
  const addon = element.getAttribute('data-ayon-addon')
  const key = element.getAttribute('data-ayon-contribution')
  const contribution =
    addon && key
      ? {
          addon,
          key,
          example: getRegistry().contributions.some(
            (c) => c.slot === slot && c.key === key && isExample(c),
          ),
        }
      : undefined
  return {
    slot,
    owner,
    contribution,
    menuOf: element.hasAttribute('data-ayon-trigger')
      ? (element.getAttribute('data-ayon-addons') || '').split(' ').filter(Boolean)
      : undefined,
  }
}

/**
 * The prompt to paste into an AI coding assistant, by id: add a contribution to the slot, or edit
 * this contribution (ending in a colon, for what to change).
 */
const promptFor = ({ slot, owner, contribution }: Inspected) => {
  const slotName = owner ? `the ${owner.name} addon's slot \`${slot}\`` : `the AYON slot \`${slot}\``
  if (contribution && !contribution.example)
    return `Edit the ${contribution.addon} addon's contribution \`${contribution.key}\` (in ${slotName}):`
  return `Add a contribution to ${slotName} in this addon.`
}

// a `display: contents` wrapper has no box of its own: its children's together
const boxOf = (element: Element) => {
  if (!element.hasAttribute('data-ayon-wrap')) return element.getBoundingClientRect()
  const boxes = [...element.children].map((child) => child.getBoundingClientRect())
  if (!boxes.length) return element.getBoundingClientRect()
  const left = Math.min(...boxes.map((b) => b.left))
  const top = Math.min(...boxes.map((b) => b.top))
  const right = Math.max(...boxes.map((b) => b.right))
  const bottom = Math.max(...boxes.map((b) => b.bottom))
  return new DOMRect(left, top, right - left, bottom - top)
}

// at the element's top-right corner: above it, else below it, else inside its top edge
const placeCard = (element: Element, card: HTMLElement) => {
  const box = boxOf(element)
  const { offsetWidth: width, offsetHeight: height } = card
  const left = Math.max(GAP, Math.min(box.right - width, innerWidth - width - GAP))
  let top = box.top - height - GAP
  if (top < GAP) top = box.bottom + GAP
  if (top + height > innerHeight - GAP) top = Math.max(GAP, box.top + GAP)
  return { left, top }
}

const CopyButton = ({
  text,
  label,
  icon,
  className,
}: {
  text: string
  label?: string
  icon: IconType
  className?: string
}) => {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])
  return (
    <Button
      variant={label ? 'surface' : 'text'}
      className={className}
      icon={copied ? 'check' : icon}
      aria-label={label ? undefined : 'Copy'}
      data-tooltip={label ? undefined : 'Copy'}
      onClick={async () => setCopied(await safeWriteClipboard(text))}
    >
      {label && (copied ? 'Copied' : label)}
    </Button>
  )
}

export const SlotInspectorCard = () => {
  const element = useInspectedElement()
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ left: number; top: number }>()

  useLayoutEffect(() => {
    setPosition(undefined)
    if (!element) return undefined
    const place = () => {
      // the element went away (a menu closed): so does the card
      if (!element.isConnected) return releaseInspected(0)
      if (ref.current) setPosition(placeCard(element, ref.current))
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [element])

  const inspected = element && describe(element)
  if (!element || !inspected) return null
  const { slot, owner, contribution, menuOf } = inspected
  const colorOf = contribution?.addon ?? owner?.name ?? AYON_ADDON
  // a modal dialog (an open menu) keeps the rest of the page inert: the card goes in it
  const dialog = element.closest('dialog')
  const container = dialog?.matches(':modal') ? dialog : document.body

  return createPortal(
    <Card
      ref={ref}
      {...{ [SLOT_CARD_ATTRIBUTE]: '' }}
      style={position ?? { visibility: 'hidden', left: 0, top: 0 }}
      // the page's click-outside handlers (an open menu's) don't see clicks on the card
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Header>
        <Swatch style={{ backgroundColor: addonColor(colorOf) }} />
        <SlotId>{slot}</SlotId>
        <CopyButton text={slot} icon="content_copy" className="copy" />
        {contribution?.example && <Badge>Example</Badge>}
        {menuOf && <Badge>Menu button</Badge>}
      </Header>
      <Muted>From {owner ? `${owner.name} ${owner.version}` : 'AYON'}</Muted>
      {contribution && !contribution.example && (
        <span>
          <Muted>Contribution </Muted>
          <Code>{contribution.key}</Code>
          <Muted> by {contribution.addon}</Muted>
        </span>
      )}
      {menuOf && (
        <span>
          <Muted>Menu with contributions by </Muted>
          {menuOf.join(', ')}
        </span>
      )}
      <Actions>
        <CopyButton text={promptFor(inspected)} label="Copy AI prompt" icon="smart_toy" />
      </Actions>
    </Card>,
    container,
  )
}
