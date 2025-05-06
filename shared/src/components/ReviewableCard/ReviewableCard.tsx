import { forwardRef, HTMLProps, MouseEvent } from 'react'
import type { ReviewableModel } from '@shared/api'
import * as Styled from './ReviewableCard.styled'
import clsx from 'clsx'

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
  sortingDisabled?: boolean
  onEdit?: (e: MouseEvent<HTMLButtonElement>) => void
}

export const ReviewableCard = forwardRef<HTMLDivElement, ReviewableCardProps>(
  (
    {
      availability,
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
      sortingDisabled,
      onEdit,
      ...props
    },
    ref,
  ) => {
    const isDraggable = (dragProps || isDragOverlay) && !sortingDisabled

    const unoptimized = availability === 'conversionRecommended'
    const isQueued = unoptimized && !!processing

    let subTitle = filename
    if (unoptimized) subTitle = 'Unoptimized - conversion recommended'
    if (isQueued) subTitle = 'Unoptimized - queued for conversion'

    let title = label
    if (unoptimized) title = filename

    return (
      <Styled.Card
        id={fileId}
        ref={ref}
        className={clsx({
          draggable: isDraggable,
          'drop-placeholder': isDropPlaceholder,
          'drag-overlay': isDragOverlay,
          dragging: isDragging, // is anything dragging
          selected: isSelected,
          editable: !!onEdit,
        })}
        {...props}
      >
        <Styled.StyledFileThumbnail
          src={`/api/projects/${projectName}/files/${fileId}/thumbnail`}
          mimetype={mimetype}
        />
        <Styled.Content>
          <Styled.Title>
            <h4>{title}</h4>
            {!!onEdit && (
              <Styled.EditButton icon="edit" variant="text" className="edit" onClick={onEdit} />
            )}
          </Styled.Title>
          <span className="name">{subTitle}</span>
        </Styled.Content>
        {isDraggable && (
          <Styled.DragHandle className="handle" {...dragProps} icon="drag_indicator" />
        )}
      </Styled.Card>
    )
  },
)
