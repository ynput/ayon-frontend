import { FC, MouseEvent, useState, DragEvent, ChangeEvent, useRef, useEffect } from 'react'
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
import SortableReviewableCard from './SortableReviewableCard'
import ReviewableCard from '@/components/ReviewableCard'
import * as Styled from './ReviewablesList.styled'
import { useDispatch, useSelector } from 'react-redux'
import { openReview, toggleUpload } from '@/features/review'
import { Icon } from '@ynput/ayon-react-components'
import axios from 'axios'
import { toast } from 'react-toastify'
import ReviewableUploadCard, { ReviewableUploadFile } from '@components/ReviewableUploadCard'
import api from '@/api'
import { $Any } from '@/types'
import { UploadReviewableApiResponse } from '@/api/rest'

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

  // are we currently looking at review?
  const reviewableIds = useSelector((state: $Any) => state.review.reviewableIds) || []

  // are we dragging a file over?
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  // dragging activeId
  const [activeId, setActiveId] = useState<null | string>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const reviewables = versionReviewables?.reviewables || []
  const draggingReview = reviewables.find((reviewable) => reviewable.activityId === activeId)
  const isLoading = isFetchingReviewables || isLoadingVersion

  const inputRef = useRef<HTMLInputElement>(null)

  const openUpload = useSelector((state: $Any) => state.review.upload)
  // when upload is true, open the file dialog programmatically
  useEffect(() => {
    if (openUpload) {
      inputRef.current?.click()
      dispatch(toggleUpload(false))
    }
  }, [openUpload])

  const handleReviewableClick = (event: MouseEvent<HTMLDivElement>) => {
    // check are not dragging
    if (activeId) return console.log('Dragging, cannot open review')

    // get the reviewable id
    const id = event.currentTarget.id
    if (!id || !productId) return console.error('No reviewable id or product id')

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
    }
    setActiveId(null)
  }

  const [uploading, setUploads] = useState<ReviewableUploadFile[]>([])
  const [completeUploads, setCompleteUploads] = useState<string[]>([])

  const handleFileUpload = async (files: FileList) => {
    const uploadingFiles = Array.from(files).map((file) => ({
      name: file.name,
      size: file.size,
      progress: 0,
    }))
    setUploads([...uploading, ...uploadingFiles])

    try {
      // upload the files
      for (const file of files) {
        const autoLabel = file.name.split('.').slice(0, -1).join('.')

        axios
          .post(
            `/api/projects/${projectName}/versions/${versionId}/reviewables?label=${autoLabel}`,
            file,
            {
              headers: {
                'content-type': file.type,
                'x-file-name': file.name,
              },
              onUploadProgress: (progressEvent) =>
                setUploads((uploads) =>
                  uploads.map((upload) => {
                    if (upload.name !== file.name) return upload
                    return {
                      ...upload,
                      progress: progressEvent.total
                        ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
                        : 0,
                    }
                  }),
                ),
            },
          )
          .then((response) => {
            // Handle successful upload
            console.log(`Upload successful for ${file.name}`)
            // patch the new data into the reviewables cache
            const data = response.data as UploadReviewableApiResponse
            dispatch(
              // @ts-ignore
              api.util.updateQueryData(
                'getReviewablesForVersion',
                { projectName, versionId },
                (draft) => {
                  if (!draft.reviewables) {
                    draft.reviewables = []
                  }
                  draft.reviewables.push(data)
                },
              ),
            )
            // also patch in the reviewables cache from product level (review player)
            dispatch(
              // @ts-ignore
              api.util.updateQueryData(
                'getReviewablesForProduct',
                { projectName, productId },
                (draft) => {
                  // for the version id
                  draft.forEach((version) => {
                    if (version.id === versionId) {
                      if (!version.reviewables) {
                        version.reviewables = []
                      }
                      version.reviewables.push(data)
                    }
                  })
                },
              ),
            )
            // remove the file from the list
            setUploads((uploads) => uploads.filter((upload) => upload.name !== file.name))

            // add to complete uploads
            setCompleteUploads((uploads) => [...uploads, data.activityId])
          })
          .catch((error) => {
            console.error(`Upload failed for ${file.name}: ${error}`)
            toast.error(`Failed to upload file: ${file.name}`)
            // add error to the file
            setUploads((uploads) =>
              uploads.map((upload) => {
                if (upload.name !== file.name) return upload
                return { ...upload, error: 'Failed to upload' }
              }),
            )
          })
      }
    } catch (error) {
      // something went wrong with everything, EEEEK!
      console.error(error)
      toast.error('Failed to upload file/s')
    }
  }

  //   when the user selects a file
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (!files) return

    handleFileUpload(files)
  }

  //   when the user drops a file
  const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggingFile(false)

    const files = event.dataTransfer.files

    if (!files) return

    handleFileUpload(files)
  }

  return (
    <>
      <Styled.ReviewablesList onDragEnter={() => setIsDraggingFile(true)}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => <Styled.LoadingCard key={index} />)
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext
              items={reviewables.map(({ activityId }) => activityId as UniqueIdentifier)}
              strategy={verticalListSortingStrategy}
            >
              {reviewables.map((reviewable) => (
                <SortableReviewableCard
                  key={reviewable.activityId}
                  onClick={handleReviewableClick}
                  isSelected={reviewableIds.includes(reviewable.activityId)}
                  isUploaded={completeUploads.includes(reviewable.activityId)}
                  {...reviewable}
                />
              ))}
            </SortableContext>

            {/* uploading items */}
            {uploading.map((file) => (
              <ReviewableUploadCard
                key={file.name}
                {...file}
                onRemove={() =>
                  setUploads((uploads) => uploads.filter((upload) => upload.name !== file.name))
                }
              />
            ))}

            {/* upload button */}
            <Styled.Upload className="upload">
              <span>Drop or click to upload</span>
              <input type="file" multiple onChange={handleInputChange} ref={inputRef} />
            </Styled.Upload>

            {/* drag overlay */}
            <DragOverlay>
              {draggingReview ? (
                <ReviewableCard
                  {...draggingReview}
                  isDragOverlay
                  isSelected={reviewableIds.includes(draggingReview.activityId)}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </Styled.ReviewablesList>

      {isDraggingFile && (
        <Styled.Dropzone
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleFileDrop}
        >
          <Icon icon="upload" />
          <span>Upload reviewable</span>
        </Styled.Dropzone>
      )}
    </>
  )
}

export default ReviewablesList
