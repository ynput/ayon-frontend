import { FC, MouseEvent, useState } from 'react'
// queries
import { useGetReviewablesForVersionQuery, useHasTranscoderQuery } from '@shared/api'
import { useDeleteReviewableMutation, useSortVersionReviewablesMutation } from '@shared/api'

// DND
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

// components
import { ReviewableCard, ReviewableProgressCard } from '@shared/components'
import SortableReviewableCard from './SortableReviewableCard'
import * as Styled from './ReviewablesList.styled'
import { toast } from 'react-toastify'

// utils
import { getGroupedReviewables } from './getGroupedReviewables'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { confirmDelete } from '@shared/util'
import EditReviewableDialog from './EditReviewableDialog'
import ReviewableUpload from './ReviewablesUpload'
import { useDetailsPanelContext } from '@shared/context'

interface ReviewablesListProps {
  projectName: string
  versionId: string
  productId: string
  isLoadingVersion: boolean
  scope: string
}

const ReviewablesList: FC<ReviewablesListProps> = ({
  projectName,
  versionId,
  productId,
  isLoadingVersion,
  scope,
}) => {
  const { onOpenViewer, user, viewer, dispatch } = useDetailsPanelContext()
  // returns all reviewables for a product
  const {
    data: versionReviewables,
    isFetching: isFetchingReviewables,
    currentData,
  } = useGetReviewablesForVersionQuery(
    { projectName, versionId: versionId },
    { skip: !versionId || !projectName },
  )

  // do we have the premium transcoder?
  const { data: hasTranscoder } = useHasTranscoderQuery(undefined)

  // are we currently looking at review? (is it selected in the viewer)
  const reviewableIds = viewer?.reviewableIds || []
  const userName = user.name
  const currentIsUser = user.data?.isUser

  // either null or the reviewable id we are editing
  const [editActivityId, setEditActivityId] = useState<null | string>(null)

  // dragging activeId
  const [activeId, setActiveId] = useState<null | string>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const reviewables = versionReviewables?.reviewables || []
  const draggingReview = reviewables.find((reviewable) => reviewable.fileId === activeId)

  const currentVersionId = currentData?.id
  const queryingNewVersion = versionId !== currentVersionId

  const isLoading = (isFetchingReviewables && queryingNewVersion) || isLoadingVersion

  const handleReviewableClick = (event: MouseEvent<HTMLDivElement>) => {
    // check are not dragging
    if (activeId) return console.log('Dragging, cannot open review')

    // get the reviewable id
    const id = event.currentTarget.id
    if (!id || !productId) return console.error('No reviewable id or product id')

    const reviewable = reviewables.find((reviewable) => reviewable.fileId === id)
    console.debug(reviewable)
    console.debug(reviewable?.mediaInfo)

    // open the reviewable dialog
    onOpenViewer?.({
      projectName: projectName,
      productId: productId,
      versionIds: [versionId],
      reviewableIds: [id],
    })
  }

  const { optimized, unoptimized, incompatible, processing, queued } = getGroupedReviewables(
    reviewables,
    hasTranscoder,
  )

  const sortableReviewables = [...optimized, ...unoptimized]

  function handleDragStart(event: DragStartEvent) {
    const { active } = event

    setActiveId(active.id as string)
  }

  const [sortVersionReviewables] = useSortVersionReviewablesMutation()

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over?.id && active.id !== over.id) {
      console.log('update review position')

      const oldIndex = sortableReviewables.findIndex(
        (reviewable) => reviewable.fileId === active.id,
      )
      const newIndex = sortableReviewables.findIndex((reviewable) => reviewable.fileId === over.id)

      //   resort the reviewables
      const newReviewables = arrayMove(sortableReviewables, oldIndex, newIndex)

      const newOrder = newReviewables.map((reviewable) => reviewable.activityId)

      try {
        // update the reviewables
        sortVersionReviewables({
          projectName,
          versionId,
          sortReviewablesRequest: { sort: newOrder },
        }).unwrap()
      } catch (error) {
        toast.error('Error sorting reviewables')
      }
    }
    setActiveId(null)
  }

  const overlayModifiers = []
  // hack to make the dnd overlay pos work inside dialog
  if (scope === 'review') {
    overlayModifiers.push((args: any) => ({
      ...args.transform,
      x: args.transform.x - 32,
      y: args.transform.y - 32,
    }))
  }

  let incompatibleMessage = ''
  if (!hasTranscoder) {
    incompatibleMessage = `The conversion transcoder is only supported on [**Ynput Cloud**](https://ynput.cloud/subscribe/ayon). Please subscribe or [contact support](https://ynput.io/services/) for more information.`
  } else {
    incompatibleMessage = 'The file is not supported by the transcoder'
  }

  const handleDownloadFile = (fileId: string, fileName: string = '') => {
    let url = `/api/projects/${projectName}/files/${fileId}`

    // if (codec) url += `.${codec}`

    // Create an invisible anchor element
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)

    // Trigger a click event on the anchor element
    a.click()

    // Remove the anchor element from the document
    document.body.removeChild(a)
  }

  const [deleteReviewable] = useDeleteReviewableMutation()

  const handleDelete = async (activityId: string, label: string) => {
    // @ts-ignore
    confirmDelete({
      header: 'Delete ' + label,
      message: 'Are you sure you want to delete this reviewable?',
      accept: async () => {
        try {
          await deleteReviewable({ activityId, projectName }).unwrap()
        } catch (error) {
          toast.error('Failed to delete reviewable')
        }
      },
    })
  }

  // create the ref and model
  const [ctxMenuShow] = useCreateContextMenu()

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    // get the reviewable by id
    const id = event.currentTarget.id

    if (!id) return

    const reviewable = reviewables.find((reviewable) => reviewable.fileId === id)

    if (!reviewable) return

    const originalFileId = reviewable.createdFrom || reviewable.fileId
    const originalReviewable = reviewables.find(
      (reviewable) => reviewable.fileId === originalFileId,
    )

    const items: {
      label: string
      icon: string
      onClick?: () => void
      disabled?: boolean
      danger?: boolean
    }[] = [
      {
        label: 'Download original',
        icon: 'download',
        onClick: () => handleDownloadFile(originalFileId, originalReviewable?.filename),
        disabled: !originalReviewable,
      },
    ]

    if (userName === reviewable.author.name || !currentIsUser) {
      items.push({
        label: 'Delete',
        icon: 'delete',
        onClick: () => handleDelete(reviewable.activityId, reviewable.label || reviewable.filename),
        danger: true,
      })
    }

    // add author
    items.push({
      label: `Author: ${reviewable.author.fullName || reviewable.author.name}`,
      icon: 'person',
      disabled: true,
    })

    ctxMenuShow(event, items)
  }

  return (
    <>
      <ReviewableUpload
        projectName={projectName}
        versionId={versionId}
        productId={productId}
        taskId={viewer?.taskId}
        folderId={viewer?.folderId}
        dispatch={dispatch}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Styled.LoadingCard key={index} className="loading" />
          ))
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveId(null)}
            >
              <SortableContext
                items={reviewables.map(({ fileId }) => fileId as UniqueIdentifier)}
                strategy={verticalListSortingStrategy}
              >
                {sortableReviewables.map((reviewable) => (
                  <SortableReviewableCard
                    key={reviewable.fileId}
                    projectName={projectName}
                    onClick={handleReviewableClick}
                    isSelected={reviewableIds.includes(reviewable.fileId)}
                    isDragging={!!activeId}
                    onContextMenu={handleContextMenu}
                    onEdit={(e) => {
                      e.stopPropagation()
                      setEditActivityId(reviewable.activityId)
                    }}
                    {...reviewable}
                  />
                ))}
              </SortableContext>

              {/* drag overlay */}
              <DragOverlay modifiers={overlayModifiers}>
                {draggingReview ? (
                  <ReviewableCard
                    {...draggingReview}
                    projectName={projectName}
                    isDragOverlay
                    isDragging
                    isSelected={reviewableIds.includes(draggingReview.fileId)}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
            {processing.map((reviewable) => (
              <ReviewableProgressCard
                key={reviewable.fileId}
                name={reviewable.filename}
                type={'processing'}
                progress={reviewable.processing?.progress}
                fileId={reviewable.fileId}
              />
            ))}

            {queued.map((reviewable) => (
              <ReviewableProgressCard
                key={reviewable.fileId}
                name={reviewable.filename}
                type={'queued'}
                fileId={reviewable.fileId}
              />
            ))}

            {incompatible.map((reviewable) => (
              <ReviewableProgressCard
                key={reviewable.fileId}
                name={reviewable.filename}
                type={'unsupported'}
                tooltip={incompatibleMessage}
                src={`/api/projects/${projectName}/files/${reviewable.fileId}/thumbnail`}
                onContextMenu={handleContextMenu}
                fileId={reviewable.fileId}
              />
            ))}
          </>
        )}
      </ReviewableUpload>

      {editActivityId && (
        <EditReviewableDialog
          isOpen
          onClose={() => setEditActivityId(null)}
          label={
            reviewables.find((reviewable) => reviewable.activityId === editActivityId)?.label || ''
          }
          projectName={projectName}
          versionId={versionId}
          activityId={editActivityId}
        />
      )}
    </>
  )
}

export default ReviewablesList
