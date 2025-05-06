import { FC } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ReviewableCardProps, ReviewableCard } from '@shared/components'

type SortableReviewableCardProps = ReviewableCardProps

const SortableReviewableCard: FC<SortableReviewableCardProps> = ({ ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.fileId,
    animateLayoutChanges: () => false,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ReviewableCard
        isDropPlaceholder={isDragging}
        dragProps={{ ...attributes, ...listeners }}
        disabled={props.sortingDisabled}
        {...props}
      />
    </div>
  )
}

export default SortableReviewableCard
