import { forwardRef, HTMLProps } from 'react'
import type { ReviewableModel } from '@api/rest'
import * as Styled from './ReviewableCard.styled'
import Typography from '@/theme/typography.module.css'
import { classNames } from 'primereact/utils'

export interface ReviewableCardProps
  extends Pick<
      ReviewableModel,
      'fileId' | 'filename' | 'label' | 'processing' | 'mimetype' | 'availability'
    >,
    Omit<HTMLProps<HTMLDivElement>, 'ref' | 'as' | 'children'> {
  // Extends div element props
  projectName: string
  isDragOverlay?: boolean
  isDropPlaceholder?: boolean
  isSelected?: boolean
  isDragging?: boolean //is something being dragged?
  dragProps?: any
}

const ReviewableCard = forwardRef<HTMLDivElement, ReviewableCardProps>(
  (
    {
      projectName,
      fileId,
      filename,
      label,
      processing,
      mimetype,
      isDragOverlay,
      isDropPlaceholder,
      isSelected,
      isDragging,
      dragProps = {},
      ...props
    },
    ref,
  ) => {
    const isDraggable = dragProps || isDragOverlay

    return (
      <Styled.Card
        id={fileId}
        ref={ref}
        className={classNames({
          draggable: isDraggable,
          'drop-placeholder': isDropPlaceholder,
          'drag-overlay': isDragOverlay,
          dragging: isDragging, // is anything dragging
          selected: isSelected,
        })}
        {...props}
      >
        <Styled.StyledFileThumbnail
          src={`/api/projects/${projectName}/files/${fileId}/thumbnail`}
          mimetype={mimetype}
        />
        <Styled.Content>
          <h4 className={Typography.titleSmall}>{label}</h4>
          <span className="name">{filename}</span>
        </Styled.Content>
        {isDraggable && (
          <Styled.DragHandle className="handle" {...dragProps} icon="drag_indicator" />
        )}
      </Styled.Card>
    )
  },
)

ReviewableCard.displayName = 'ReviewableCard'

export default ReviewableCard
