import { useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import { isEnumIconImage } from '@shared/util/attributeEnum'
import * as Styled from './MultiSelectValue.styled'

export type MultiSelectValueItem = { value: string; label: string; icon?: string }

type Fit = {
  /** values shown, from the first */
  shown: number
  /** where the count of the others starts */
  moreLeft: number
  /** the room the first value gets when it is the only one shown */
  clipWidth?: number
  /** how much the cut lops off the value: a spacer keeps that room in the field's natural
   * width, which would otherwise shrink to the cut value */
  deficit?: number
}

// the gap between two values (MultiSelectValue.styled)
const GAP = 8
// sizes are fractional: a list of values that fits exactly can round a pixel past its field
const TOLERANCE = 1

const measureFit = (list: HTMLElement, more: HTMLElement | null, count: number): Fit => {
  const items = Array.from(list.querySelectorAll<HTMLElement>(':scope > .multi-select-item'))
  const sizer = list.querySelector<HTMLElement>(':scope > .multi-select-sizer')
  // measure the values at their full width: a first value cut short moves the others, and its
  // spacer would widen the field
  const first = items[0]
  const clipped = first?.classList.contains('is-clipped')
  const clipStyle = first?.style.maxWidth
  if (clipped) {
    first.classList.remove('is-clipped')
    first.style.maxWidth = ''
  }
  if (sizer) sizer.style.display = 'none'
  const box = list.getBoundingClientRect()
  // where each value ends and the next starts, from the start of the field
  const ends = items.map((item) => item.getBoundingClientRect().right - box.left)
  const starts = items.map((item) => item.getBoundingClientRect().left - box.left)
  if (clipped) {
    first.classList.add('is-clipped')
    first.style.maxWidth = clipStyle
  }
  if (sizer) sizer.style.display = ''

  const width = box.width + TOLERANCE
  if (!items.length || ends[ends.length - 1] <= width) return { shown: count, moreLeft: 0 }

  // a lone value has no count beside it: it takes the field
  if (items.length === 1) {
    const clipWidth = Math.max(0, Math.floor(width - TOLERANCE))
    return { shown: 1, moreLeft: 0, clipWidth, deficit: Math.ceil(ends[0] - clipWidth) }
  }

  // the count goes after the last value that fits with it
  const room = width - GAP - (more?.getBoundingClientRect().width ?? 0)
  let shown = 0
  while (shown < items.length && ends[shown] <= room) shown++
  if (shown) return { shown, moreLeft: Math.round(starts[shown]) }
  // not even the first one fits: it is cut short, so a value always shows
  const clipWidth = Math.max(0, Math.floor(room - TOLERANCE))
  return {
    shown: 1,
    moreLeft: clipWidth + GAP,
    clipWidth,
    deficit: Math.ceil(ends[0] - clipWidth),
  }
}

/**
 * A multi-select's value in the flat layout: the values that fit, then "+N" for the others,
 * which the tooltip lists in full. Every value stays laid out, the others unseen, so the
 * field's natural width is the whole list's: a field that grows shows them again.
 */
export const MultiSelectValue = ({ items }: { items: MultiSelectValueItem[] }) => {
  const listRef = useRef<HTMLSpanElement>(null)
  const moreRef = useRef<HTMLSpanElement>(null)
  const [fit, setFit] = useState<Fit>({ shown: items.length, moreLeft: 0 })
  // the dropdown builds the list on every render: measure again only when the values change
  const itemsKey = items.map((item) => `${item.value}\u0000${item.label}`).join('\u0001')

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const update = () => {
      const next = measureFit(list, moreRef.current, items.length)
      setFit((prev) =>
        prev.shown === next.shown &&
        prev.moreLeft === next.moreLeft &&
        prev.clipWidth === next.clipWidth &&
        prev.deficit === next.deficit
          ? prev
          : next,
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(list)
    // values measured before the font loads are narrower than they end up: the list's own
    // size doesn't change when it does, so it is measured again
    let active = true
    document.fonts?.ready.then(() => active && update())
    return () => {
      active = false
      observer.disconnect()
    }
  }, [itemsKey, items.length])

  const hidden = items.length - fit.shown
  const cut = fit.clipWidth !== undefined

  return (
    <Styled.Value
      ref={listRef}
      className="multi-select-value"
      data-tooltip={hidden || cut ? items.map((item) => item.label).join(', ') : undefined}
    >
      {items.map((item, index) => (
        <Styled.Item
          key={item.value}
          className={clsx(
            'multi-select-item',
            index >= fit.shown && 'is-hidden',
            index === 0 && cut && 'is-clipped',
          )}
          style={index === 0 && cut ? { maxWidth: fit.clipWidth } : undefined}
        >
          {item.icon &&
            (isEnumIconImage(item.icon) ? (
              <Styled.ItemImage src={item.icon} alt="" />
            ) : (
              <Icon icon={item.icon} />
            ))}
          <span>{item.label}</span>
        </Styled.Item>
      ))}
      {!!fit.deficit && (
        <Styled.Sizer className="multi-select-sizer" style={{ width: fit.deficit }} aria-hidden />
      )}
      <Styled.More
        ref={moreRef}
        className={clsx('multi-select-more', !hidden && 'is-hidden')}
        style={{
          left: fit.moreLeft,
          minWidth: `calc(${String(items.length).length + 1}ch + 12px)`,
        }}
        aria-hidden={!hidden}
      >
        +{hidden}
      </Styled.More>
    </Styled.Value>
  )
}
