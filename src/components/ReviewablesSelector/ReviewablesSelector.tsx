import { FC, useEffect } from 'react'
import * as Styled from './ReviewablesSelector.styled'
import Typography from '@/theme/typography.module.css'
import { classNames } from 'primereact/utils'

type ReviewableCard = {
  activityId: string
  fileId: string
  updatedAt: string
  label: string
}

interface ReviewablesSelectorProps {
  reviewables: ReviewableCard[]
  selected: string[]
  onChange?: (activityId: string) => void
}

const ReviewablesSelector: FC<ReviewablesSelectorProps> = ({
  reviewables = [],
  selected = [],
  onChange,
}) => {
  // add keyboard support
  // use up and down arrow keys to navigate through the reviewables
  // if at top and press up, go to bottom, if at bottom and press down, go to top
  useEffect(() => {
    if (reviewables.length === 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const currentIndex = reviewables.findIndex(({ activityId }) =>
          selected.includes(activityId),
        )
        const nextIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1
        const nextActivityId =
          reviewables[nextIndex < 0 ? reviewables.length - 1 : nextIndex % reviewables.length]
            .activityId

        onChange && onChange(nextActivityId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selected, reviewables, onChange])

  // if only one return null
  //   if (reviewables.length === 1) return null

  return (
    <Styled.ReviewablesSelector>
      {reviewables.map(({ activityId, label }) => (
        <Styled.ReviewableCard
          key={activityId}
          onClick={() => onChange && onChange(activityId)}
          className={classNames({ selected: selected.includes(activityId) })}
        >
          <img src={'https://placehold.co/160x90'} />
          <span className={Typography.labelSmall}>{label}</span>
        </Styled.ReviewableCard>
      ))}
    </Styled.ReviewablesSelector>
  )
}

export default ReviewablesSelector
