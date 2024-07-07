import { forwardRef, HTMLProps } from 'react'
import type { ReviewableModel } from '@api/rest'
import * as Styled from './ReviewableCard.styled'
import Typography from '@/theme/typography.module.css'
import { classNames } from 'primereact/utils'

export interface ReviewableCardProps
  extends Pick<
      ReviewableModel,
      'activityId' | 'fileId' | 'filename' | 'label' | 'processing' | 'mimetype'
    >,
    Omit<HTMLProps<HTMLDivElement>, 'ref' | 'as' | 'children'> {
  // Extends div element props
  isDragOverlay?: boolean
  isDropPlaceholder?: boolean
  dragProps?: any
}

const ReviewableCard = forwardRef<HTMLDivElement, ReviewableCardProps>(
  (
    {
      activityId,
      fileId,
      filename,
      label,
      processing,
      mimetype,
      isDragOverlay,
      isDropPlaceholder,
      dragProps = {},
      ...props
    },
    ref,
  ) => {
    return (
      <Styled.Card
        id={activityId}
        ref={ref}
        className={classNames({
          'drop-placeholder': isDropPlaceholder,
          'drag-overlay': isDragOverlay,
        })}
        {...props}
      >
        <Styled.Image src={`https://via.placeholder.com/160x90`} />
        <Styled.Content>
          <h4 className={Typography.titleSmall}>{label}</h4>
          <span className="name">{filename}</span>
        </Styled.Content>
        {(dragProps || isDragOverlay) && (
          <Styled.DragHandle className="handle" {...dragProps} icon="drag_indicator" />
        )}
      </Styled.Card>
    )
  },
)

ReviewableCard.displayName = 'ReviewableCard'

export default ReviewableCard
