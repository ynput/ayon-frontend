import { forwardRef, HTMLProps } from 'react'
import type { ReviewableModel } from '@api/rest'
import * as Styled from './ReviewableCard.styled'
import Typography from '@/theme/typography.module.css'
import { classNames } from 'primereact/utils'
import { Icon } from '@ynput/ayon-react-components'

export interface ReviewableCardProps
  extends Pick<
      ReviewableModel,
      'activityId' | 'fileId' | 'filename' | 'label' | 'processing' | 'mimetype'
    >,
    Omit<HTMLProps<HTMLDivElement>, 'ref' | 'as' | 'children'> {
  // Extends div element props
  isDragOverlay?: boolean
  isDropPlaceholder?: boolean
  isSelected?: boolean
  isUploaded?: boolean // has just been uploaded?
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
      isSelected,
      isUploaded,
      dragProps = {},
      ...props
    },
    ref,
  ) => {
    const isDraggable = dragProps || isDragOverlay

    return (
      <Styled.Card
        id={activityId}
        ref={ref}
        className={classNames({
          draggable: isDraggable,
          'drop-placeholder': isDropPlaceholder,
          'drag-overlay': isDragOverlay,
          selected: isSelected,
        })}
        {...props}
      >
        <Styled.Image src={`https://via.placeholder.com/160x90`} />
        <Styled.Content>
          <h4 className={Typography.titleSmall}>{label}</h4>
          <span className="name">{filename}</span>
        </Styled.Content>
        {isDraggable && (
          <Styled.DragHandle className="handle" {...dragProps} icon="drag_indicator" />
        )}
        {isUploaded && (
          <div className="uploaded">
            Uploaded
            <Icon icon="check_circle" />
          </div>
        )}
      </Styled.Card>
    )
  },
)

ReviewableCard.displayName = 'ReviewableCard'

export default ReviewableCard
