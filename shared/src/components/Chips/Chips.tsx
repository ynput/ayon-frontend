import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import React, { FC, useRef, useState, useLayoutEffect, HTMLAttributes } from 'react'
import styled from 'styled-components'

const ChipsContainer = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  align-self: stretch;
  width: 100%;
  overflow: hidden;

  &.multi-row {
    flex-wrap: wrap;
    align-content: flex-start;
  }

  &.stacked {
    align-items: flex-start;
  }
`

const Chip = styled.div`
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  padding: 2px 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;

  display: flex;
  align-items: center;
  gap: 4px;

  flex-shrink: 0;
  min-width: auto;
  &.last {
    flex-shrink: 1;
    min-width: 0;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }
`

const OffscreenChip = styled(Chip)`
  visibility: hidden;
  position: absolute;
  top: -9999px;
  left: -9999px;
  z-index: -100;
`

const MoreChip = styled(Chip)`
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`

const AddIcon = styled(Icon)`
  background-color: var(--md-sys-color-surface-container);
  border-radius: var(--border-radius-m);
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }
`

export type ChipValue = {
  label: string
  tooltip: string
  icon?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

interface ChipsProps {
  values: ChipValue[]
  disabled?: boolean
  wrapMinHeight?: number
  pt?: {
    chip?: Partial<HTMLAttributes<HTMLDivElement>>
  }
}

type ChipsLayout = {
  visibleCount: number
  rows: number
  isTall: boolean
}

export const Chips: FC<ChipsProps> = ({ values, disabled, wrapMinHeight, pt }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [{ visibleCount, rows, isTall }, setLayout] = useState<ChipsLayout>({
    visibleCount: 0,
    rows: 1,
    isTall: false,
  })
  const [offscreenChips, setOffscreenChips] = useState<ChipValue[]>([])

  useLayoutEffect(() => {
    setOffscreenChips(values)
  }, [values])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || offscreenChips.length === 0) return

    const chipElements = Array.from(container.querySelectorAll('.offscreen-chip'))
    if (chipElements.length !== values.length) return

    const gap = parseFloat(getComputedStyle(container).rowGap) || 0
    const chipWidths = chipElements.map((el) => el.getBoundingClientRect().width)
    const chipHeight = chipElements[0].getBoundingClientRect().height
    // measured offscreen at its widest label, so it does not depend on the +N chip being rendered
    const moreChipWidth =
      container.querySelector('.offscreen-more-chip')?.getBoundingClientRect().width || 60

    const rowsNeeded = (count: number, extraWidth: number, containerWidth: number) => {
      let used = 1
      let rowWidth = 0
      const place = (width: number, isFirst: boolean) => {
        if (isFirst) rowWidth = width
        else if (rowWidth + gap + width <= containerWidth) rowWidth += gap + width
        else {
          used++
          rowWidth = width
        }
      }

      for (let i = 0; i < count; i++) place(chipWidths[i], i === 0)
      if (extraWidth) place(extraWidth, count === 0)
      return used
    }

    const calculateLayout = () => {
      const containerWidth = container.getBoundingClientRect().width
      const containerHeight = container.offsetHeight
      const rows = chipHeight
        ? Math.max(1, Math.floor((containerHeight + gap) / (chipHeight + gap)))
        : 1

      // drop chips until they and the more chip fit the rows available
      let visibleCount = values.length
      while (
        visibleCount > 1 &&
        rowsNeeded(visibleCount, visibleCount < values.length ? moreChipWidth : 0, containerWidth) >
          rows
      ) {
        visibleCount--
      }

      const isTall = wrapMinHeight !== undefined && containerHeight >= wrapMinHeight

      setLayout((prev) =>
        prev.visibleCount === visibleCount && prev.rows === rows && prev.isTall === isTall
          ? prev
          : { visibleCount, rows, isTall },
      )
    }

    const resizeObserver = new ResizeObserver(calculateLayout)
    resizeObserver.observe(container)

    // Initial calculation
    calculateLayout()

    return () => resizeObserver.disconnect()
  }, [values, offscreenChips, wrapMinHeight])

  if (disabled) return null

  // for no values return plus button
  if (!values.length) {
    return <AddIcon icon="add" className={pt?.chip?.className} />
  }

  const visibleValues = values.slice(0, visibleCount)
  const hiddenCount = visibleCount ? values.length - visibleValues.length : 0

  return (
    <ChipsContainer ref={containerRef} className={clsx({ 'multi-row': rows > 1, stacked: isTall })}>
      {visibleValues.map((chip, index) => (
        <Chip
          {...pt?.chip}
          key={chip.label + index}
          data-tooltip={chip.tooltip}
          className={clsx(
            'chip',
            { last: index === visibleValues.length - 1 && hiddenCount > 0 },
            pt?.chip?.className,
          )}
        >
          {chip.prefix}
          {chip?.icon && <Icon icon={chip.icon} />}
          {chip.label}
          {chip.suffix}
        </Chip>
      ))}
      {hiddenCount > 0 && (
        <MoreChip className={clsx('more-chip', pt?.chip?.className)}>+{hiddenCount}</MoreChip>
      )}
      {offscreenChips.map((chip, index) => (
        <OffscreenChip key={chip.label + index} className="offscreen-chip">
          {chip.prefix}
          {chip?.icon && <Icon icon={chip.icon} />}
          {chip.label}
          {chip.suffix}
        </OffscreenChip>
      ))}
      {offscreenChips.length > 1 && (
        <OffscreenChip className="offscreen-more-chip">+{offscreenChips.length - 1}</OffscreenChip>
      )}
    </ChipsContainer>
  )
}
