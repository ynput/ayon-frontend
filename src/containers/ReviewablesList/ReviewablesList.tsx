import { useGetReviewablesForVersionQuery } from '@/services/review/getReview'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { FC, MouseEvent, useState } from 'react'
import SortableReviewableCard from './SortableReviewableCard'
import ReviewableCard from '@/components/ReviewableCard'
import * as Styled from './ReviewablesList.styled'
import { useDispatch } from 'react-redux'
import { openReview } from '@/features/review'

interface ReviewablesListProps {
  projectName: string
  versionId: string
  productId: string
  isLoadingVersion: boolean
}

const ReviewablesList: FC<ReviewablesListProps> = ({
  projectName,
  versionId,
  productId,
  isLoadingVersion,
}) => {
  const dispatch = useDispatch()
  // returns all reviewables for a product
  const { data: versionReviewables, isFetching: isFetchingReviewables } =
    useGetReviewablesForVersionQuery(
      { projectName, versionId: versionId },
      { skip: !versionId || !projectName },
    )

  const [activeId, setActiveId] = useState<null | string>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  if (!versionReviewables) return null

  const reviewables = versionReviewables.reviewables || []
  const draggingReview = reviewables.find((reviewable) => reviewable.activityId === activeId)
  const isLoading = isFetchingReviewables || isLoadingVersion

  const handleReviewableClick = (event: MouseEvent<HTMLDivElement>) => {
    // check are not dragging
    if (activeId) return

    // get the reviewable id
    const id = event.currentTarget.id
    if (!id || !productId) return

    // open the reviewable dialog
    dispatch(
      openReview({
        projectName: projectName,
        productId: productId,
        versionIds: [versionId],
        reviewableIds: [id],
      }),
    )
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event

    setActiveId(active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over?.id && active.id !== over.id) {
      console.log('update review position')

      const oldIndex = reviewables.findIndex((reviewable) => reviewable.activityId === active.id)
      const newIndex = reviewables.findIndex((reviewable) => reviewable.activityId === over.id)

      //   resort the reviewables
      const newReviewables = arrayMove(reviewables, oldIndex, newIndex)

      console.log(newReviewables)

      setActiveId(null)
    }
  }

  return (
    <Styled.ReviewablesList>
      {isLoading ? (
        Array.from({ length: 3 }).map((_, index) => <Styled.LoadingCard key={index} />)
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={reviewables.map(({ activityId }) => activityId as UniqueIdentifier)}
            strategy={verticalListSortingStrategy}
          >
            {reviewables.map((reviewable) => (
              <SortableReviewableCard
                key={reviewable.activityId}
                onClick={handleReviewableClick}
                {...reviewable}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {draggingReview ? <ReviewableCard {...draggingReview} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </Styled.ReviewablesList>
  )
}

export default ReviewablesList
