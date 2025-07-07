import { FC, useRef, useState, useLayoutEffect } from 'react'
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

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }
`

const MoreChip = styled(Chip)`
  flex-shrink: 0;
`

interface ChipsProps {
  values: string[]
}

export const Chips: FC<ChipsProps> = ({ values }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleValues, setVisibleValues] = useState<string[]>([])
  const [hiddenCount, setHiddenCount] = useState(0)

  useLayoutEffect(() => {
    const calculateVisibleChips = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.offsetWidth
      let totalWidth = 0
      let newVisibleValues: string[] = []

      const moreChipWidth = 60 // Approximate width of the "+X" chip

      for (let i = 0; i < values.length; i++) {
        const value = values[i]
        const chip = document.createElement('div')
        chip.style.visibility = 'hidden'
        chip.style.position = 'absolute'
        chip.className = 'chip' // for styling if needed
        chip.innerText = value
        document.body.appendChild(chip)
        const chipWidth = chip.offsetWidth + 12 // padding + gap
        document.body.removeChild(chip)

        if (i === 0) {
          totalWidth += chipWidth
          newVisibleValues.push(value)
        } else {
          // check if the next chip and the more chip can fit
          if (totalWidth + chipWidth + moreChipWidth < containerWidth) {
            totalWidth += chipWidth
            newVisibleValues.push(value)
          } else {
            // check if just the more chip can fit
            if (totalWidth + moreChipWidth < containerWidth) {
              setHiddenCount(values.length - newVisibleValues.length)
            } else {
              // if not even the first chip and the more chip can fit
              // remove the last visible chip and update count
              newVisibleValues.pop()
              setHiddenCount(values.length - newVisibleValues.length)
            }
            break
          }
        }
      }

      if (newVisibleValues.length === values.length) {
        setHiddenCount(0)
      }

      setVisibleValues(newVisibleValues)
    }

    calculateVisibleChips()
    window.addEventListener('resize', calculateVisibleChips)
    return () => window.removeEventListener('resize', calculateVisibleChips)
  }, [values])

  return (
    <ChipsContainer ref={containerRef}>
      {visibleValues.map((value) => (
        <Chip key={value} title={value}>
          {value}
        </Chip>
      ))}
      {hiddenCount > 0 && <MoreChip>+{hiddenCount}</MoreChip>}
    </ChipsContainer>
  )
}
