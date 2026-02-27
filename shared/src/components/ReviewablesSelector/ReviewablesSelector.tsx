import { FC, useEffect, useRef, useState } from 'react'
import * as Styled from './ReviewablesSelector.styled'
import clsx from 'clsx'
import { FileThumbnail } from '@shared/components'
import { ReviewableModel } from '@shared/api'
import { isHTMLElement } from '@shared/util'
import ScrollBar from 'react-perfect-scrollbar'

type ReviewableCard = Pick<ReviewableModel, 'fileId' | 'label' | 'fileId'>

interface ReviewablesSelectorProps {
  reviewables: ReviewableCard[]
  selected: string[]
  projectName: string | null
  onChange?: (fileId: string) => void
  onUpload?: () => void
}

const ReviewablesSelector: FC<ReviewablesSelectorProps> = ({
  reviewables = [],
  selected = [],
  projectName,
  onChange,
  onUpload,
}) => {
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

  // add keyboard support
  // use up and down arrow keys to navigate through the reviewables
  // if at top and press up, go to bottom, if at bottom and press down, go to top
  useEffect(() => {
    if (reviewables.length === 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        // Check if e.target is an HTMLElement before accessing tagName or isContentEditable
        if (isHTMLElement(e.target)) {
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
          if (e.target.isContentEditable) return
        }

        const currentIndex = reviewables.findIndex(({ fileId }) => selected.includes(fileId))
        const nextIndex = e.key === 'w' || e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1
        const nextReviewable =
          reviewables[nextIndex < 0 ? reviewables.length - 1 : nextIndex % reviewables.length]
        const nextFileId = nextReviewable.fileId

        onChange && onChange(nextFileId)
        requestAnimationFrame(() => scrollReviewableIntoView(nextFileId))
        // also set new label for the tooltip
        setLabelTooltip(nextReviewable.label ?? null)
        // set label tooltip position
        const el = document.getElementById('preview-' + nextFileId)

        if (el) {
          const top = el.offsetTop + el.offsetHeight / 2 - getScrollTop()
          setLabelTooltipYPos(top)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selected, reviewables, onChange])

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
    { label }: Pick<ReviewableCard, 'label'>,
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
        containerRef={(ref) => {
          scrollContainerRef.current = ref
        }}
      >
        {reviewables.map(({ fileId, label }) => (
          <Styled.ReviewableCard
            key={fileId}
            id={'preview-' + fileId}
            onClick={() => onChange && onChange(fileId)}
            className={clsx('reviewable-card', { selected: selected.includes(fileId) })}
            onMouseOver={(e) => handleMouseOver(e, { label })}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <FileThumbnail src={`/api/projects/${projectName}/files/${fileId}/thumbnail`} />
          </Styled.ReviewableCard>
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
}

export default ReviewablesSelector
