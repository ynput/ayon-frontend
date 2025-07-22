import clsx from 'clsx'
import { FC, useRef, useState, useLayoutEffect, HTMLAttributes } from 'react'
import styled from 'styled-components'

const ChipsContainer = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  width: 100%;
  overflow: hidden;
`

const Chip = styled.div`
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  padding: 2px 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;

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
`

const Disabled = styled.div`
  width: 100%;
  /* background-color: var(--md-sys-color-surface-container); */
  text-align: center;
  color: var(--md-sys-color-outline);
`

export type ChipValue = {
  label: string
  tooltip: string
}

interface ChipsProps {
  values: ChipValue[]
  disabled?: boolean
  pt?: {
    chip?: Partial<HTMLAttributes<HTMLDivElement>>
  }
}

export const Chips: FC<ChipsProps> = ({ values, disabled, pt }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleValues, setVisibleValues] = useState<ChipValue[]>([])
  const [hiddenCount, setHiddenCount] = useState(0)
  const [offscreenChips, setOffscreenChips] = useState<ChipValue[]>([])

  useLayoutEffect(() => {
    setOffscreenChips(values)
  }, [values])

  useLayoutEffect(() => {
    const calculateVisibleChips = () => {
      if (!containerRef.current || offscreenChips.length === 0) return

      const containerWidth = containerRef.current.offsetWidth
      const chipElements = Array.from(containerRef.current.querySelectorAll('.offscreen-chip'))
      const moreChipElement = containerRef.current.querySelector('.more-chip')

      if (!chipElements.length) return

      let totalWidth = 0
      const newVisibleValues: ChipValue[] = []

      const moreChipWidth = moreChipElement?.getBoundingClientRect().width || 60

      // Always show the first chip
      if (values.length > 0) {
        const firstChipWidth = chipElements[0].getBoundingClientRect().width
        newVisibleValues.push(values[0])
        totalWidth += firstChipWidth
      }

      // Add additional chips if they fit
      for (let i = 1; i < values.length; i++) {
        const chipWidth = chipElements[i].getBoundingClientRect().width

        // Check if the next chip can fit completely
        if (totalWidth + chipWidth <= containerWidth) {
          totalWidth += chipWidth
          newVisibleValues.push(values[i])
        } else {
          // Check if there's room for the more chip
          if (totalWidth + moreChipWidth <= containerWidth) {
            // Keep current visible chips and show more chip
            break
          } else {
            // Remove the last chip if we need room for the more chip
            if (newVisibleValues.length > 1) {
              const lastChipWidth =
                chipElements[newVisibleValues.length - 1].getBoundingClientRect().width
              totalWidth -= lastChipWidth
              newVisibleValues.pop()
            }
            break
          }
        }
      }

      const finalHiddenCount = values.length - newVisibleValues.length
      setVisibleValues(newVisibleValues)
      setHiddenCount(finalHiddenCount)
    }

    const resizeObserver = new ResizeObserver(calculateVisibleChips)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Initial calculation
    calculateVisibleChips()

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
    }
  }, [values, offscreenChips])

  if (disabled) return <Disabled>-</Disabled>

  return (
    <ChipsContainer ref={containerRef}>
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
          {chip.label}
        </Chip>
      ))}
      {hiddenCount > 0 && (
        <MoreChip className={clsx('more-chip', pt?.chip?.className)}>+{hiddenCount}</MoreChip>
      )}
      {offscreenChips.map((chip, index) => (
        <OffscreenChip key={chip.label + index} className="offscreen-chip">
          {chip.label}
        </OffscreenChip>
      ))}
    </ChipsContainer>
  )
}
