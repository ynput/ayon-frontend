import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import * as Styled from './ReviewablesSelector.styled'
import ScrollBar from 'react-perfect-scrollbar'
import Card, { ReviewableCard, ReviewableCardProps } from './Card'

interface ReviewablesSelectorProps {
  reviewables: ReviewableCard[]
  selected: string[]
  projectName: string | null
  onChange?: (fileId: string, modifier?: boolean) => void
  onUpload?: () => void
}

export type ReviewablesSelectorHandle = {
  notifyNavigation: (next: { fileId: string; label?: string | null }) => void
}

const ReviewablesSelector = forwardRef<ReviewablesSelectorHandle, ReviewablesSelectorProps>(({
  reviewables = [],
  selected = [],
  projectName,
  onChange,
  onUpload,
}, ref) => {
  const scrollRef = useRef<ScrollBar>(null)
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const [labelTooltip, setLabelTooltip] = useState<null | string>(null)
  const [labelTooltipYPos, setLabelTooltipYPos] = useState<null | number>(null)

  const getScrollTop = (): number => {
    return scrollContainerRef.current?.scrollTop || 0
  }

  const scrollReviewableIntoView = (fileId: string) => {
    const container = scrollContainerRef.current
    const el = document.getElementById('preview-' + fileId)
    if (!container || !el) return

    const containerRect = container.getBoundingClientRect()
    const itemRect = el.getBoundingClientRect()

    if (itemRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - itemRect.top
    } else if (itemRect.bottom > containerRect.bottom) {
      container.scrollTop += itemRect.bottom - containerRect.bottom
    }

    // keep the custom scrollbar thumb in sync with manual scrollTop updates
    // @ts-ignore
    scrollRef.current?.updateScroll?.()
  }

  // Imperative hook for the parent: keyboard nav lives upstream so it works
  // in theatre mode (where this component is unmounted). When nav happens,
  // we still update scroll + tooltip via this handle.
  useImperativeHandle(
    ref,
    () => ({
      notifyNavigation: ({ fileId, label }) => {
        requestAnimationFrame(() => scrollReviewableIntoView(fileId))
        setLabelTooltip(label ?? null)
        const el = document.getElementById('preview-' + fileId)
        if (el) {
          const top = el.offsetTop + el.offsetHeight / 2 - getScrollTop()
          setLabelTooltipYPos(top)
          el.focus({ preventScroll: true })
        }
      },
    }),
    [],
  )

  // keep track of when NOT hovering over the reviewable cards
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // check if the mouse is over a reviewable card
      const closest = (event.target as HTMLElement).closest('.reviewables')
      if (!closest) {
        setLabelTooltip(null)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const handleMouseOver = (
    event: React.MouseEvent<HTMLDivElement>,
    { label }: Pick<ReviewableCardProps, 'label'>,
  ) => {
    // check event is coming from a reviewable card
    const closest = (event.target as HTMLElement).closest('.reviewable-card') as HTMLElement
    if (!closest) return
    setLabelTooltip(label ?? null)
    // set label tooltip position
    const top = closest.offsetTop + closest.offsetHeight / 2 - getScrollTop()
    setLabelTooltipYPos(top)
  }

  // select with enter or space key when focused on a reviewable card
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      const closest = (event.target as HTMLElement).closest('.reviewable-card') as HTMLElement
      if (!closest) return
      const fileId = closest.id.replace('preview-', '')
      onChange && onChange(fileId)
    }
  }

  // if no reviewables, return null
  if (!reviewables.length) return <div />

  return (
    <Styled.ReviewablesSelector>
      <Styled.Scrollable
        className="reviewables"
        ref={scrollRef}
        containerRef={(el) => {
          scrollContainerRef.current = el
        }}
      >
        {reviewables.map(({ fileId, label, tag, selectionVariant, contextMenuItems }) => (
          <Card
            key={fileId}
            projectName={projectName}
            fileId={fileId}
            label={label}
            selected={selected.includes(fileId)}
            selectionVariant={selectionVariant}
            tag={tag}
            contextMenuItems={contextMenuItems}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            onMouseOver={handleMouseOver}
          />
        ))}
        {!!onUpload && (
          <Styled.AddButton
            icon="add"
            onClick={onUpload}
            onMouseEnter={() => setLabelTooltip(null)}
          />
        )}
      </Styled.Scrollable>
      {labelTooltip && labelTooltipYPos && (
        <Styled.Label style={{ top: labelTooltipYPos }}>{labelTooltip}</Styled.Label>
      )}
    </Styled.ReviewablesSelector>
  )
})

export default ReviewablesSelector
