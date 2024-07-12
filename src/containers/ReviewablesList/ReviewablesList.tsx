import { FC, MouseEvent, useState, DragEvent, ChangeEvent, useRef, useEffect } from 'react'
import { useGetReviewablesForVersionQuery, useHasTranscoderQuery } from '@queries/review/getReview'
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
import ReviewableCard from '@components/ReviewableCard'
import * as Styled from './ReviewablesList.styled'
import { useDispatch, useSelector } from 'react-redux'
import { openViewer, toggleUpload } from '@state/viewer'
import { Icon } from '@ynput/ayon-react-components'
import axios from 'axios'
import { toast } from 'react-toastify'
import ReviewableProgressCard, { ReviewableProgress } from '@components/ReviewableProgressCard'
import api from '@api'
import { $Any } from '@types'
import { UploadReviewableApiResponse } from '@api/rest'
import { getGroupedReviewables } from './getGroupedReviewables'
import useCreateContext from '@/hooks/useCreateContext'

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
  const dispatch = useDispatch()
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

  // are we currently looking at review?
  const reviewableIds = useSelector((state: $Any) => state.viewer.reviewableIds) || []

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
  const draggingReview = reviewables.find((reviewable) => reviewable.fileId === activeId)

  const currentVersionId = currentData?.id
  const queryingNewVersion = versionId !== currentVersionId

  const isLoading = (isFetchingReviewables && queryingNewVersion) || isLoadingVersion

  const inputRef = useRef<HTMLInputElement>(null)

  const openUpload = useSelector((state: $Any) => state.viewer.upload)
  // when upload is true, open the file dialog programmatically
  useEffect(() => {
    if (openUpload) {
      dispatch(toggleUpload(false))
      inputRef.current?.click()
    }
  }, [openUpload, dispatch, toggleUpload])

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
    dispatch(
      openViewer({
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

      const oldIndex = reviewables.findIndex((reviewable) => reviewable.fileId === active.id)
      const newIndex = reviewables.findIndex((reviewable) => reviewable.fileId === over.id)

      //   resort the reviewables
      const newReviewables = arrayMove(reviewables, oldIndex, newIndex)

      console.log(newReviewables)
    }
    setActiveId(null)
  }

  const [uploading, setUploads] = useState<{ [key: string]: ReviewableProgress[] }>({})

  const handleRemoveUpload = (name: string) => {
    setUploads((uploads) => ({
      ...uploads,
      [versionId]: uploads[versionId]?.filter((upload) => upload.name !== name) || [],
    }))
  }

  const handleFileUpload = async (files: FileList) => {
    const uploadingFiles = Array.from(files).map((file) => ({
      name: file.name,
      size: file.size,
      progress: 0,
    }))

    const newUploadsForVersion = [...(uploading[versionId] || []), ...uploadingFiles]

    setUploads({ ...uploading, [versionId]: newUploadsForVersion })

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
                setUploads((uploads) => {
                  // current uploads for versionId
                  const currentUploads = uploads[versionId] || []
                  const updatedUploads = currentUploads.map((upload) => {
                    if (upload.name !== file.name) return upload
                    return {
                      ...upload,
                      progress: progressEvent.total
                        ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
                        : 0,
                    }
                  })

                  // update state
                  return {
                    ...uploads,
                    [versionId]: updatedUploads,
                  }
                }),
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
            handleRemoveUpload(file.name)
          })
          .catch((error) => {
            console.error(`Upload failed for ${file.name}: ${error}`)
            toast.error(`Failed to upload file: ${file.name}`)
            // add error to the file
            setUploads((uploads) => {
              // current uploads for versionId
              const currentUploads = uploads[versionId] || []
              const updatedUploads = currentUploads.map((upload) => {
                if (upload.name !== file.name) return upload
                return {
                  ...upload,
                  error: error.message,
                }
              })

              // update state
              return {
                ...uploads,
                [versionId]: updatedUploads,
              }
            })
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

  // create the ref and model
  const [ctxMenuShow] = useCreateContext()

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

    const items = [
      {
        label: 'Download original',
        icon: 'download',
        onClick: () => handleDownloadFile(originalFileId, originalReviewable?.filename),
        disabled: !originalReviewable,
      },
    ]

    ctxMenuShow(event, items)
  }

  const { optimized, unoptimized, incompatible, processing, queued } = getGroupedReviewables(
    reviewables,
    hasTranscoder,
  )

  return (
    <>
      {!isDraggingFile && (
        <Styled.ReviewablesList onDragEnter={() => setIsDraggingFile(true)}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <Styled.LoadingCard key={index} />)
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
                  {optimized.map((reviewable) => (
                    <SortableReviewableCard
                      key={reviewable.fileId}
                      projectName={projectName}
                      onClick={handleReviewableClick}
                      isSelected={reviewableIds.includes(reviewable.fileId)}
                      isDragging={!!activeId}
                      onContextMenu={handleContextMenu}
                      {...reviewable}
                    />
                  ))}
                </SortableContext>

                {unoptimized.map((reviewable) => (
                  <ReviewableCard
                    key={reviewable.fileId}
                    projectName={projectName}
                    onClick={handleReviewableClick}
                    {...reviewable}
                    onContextMenu={handleContextMenu}
                  />
                ))}

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

              {/* uploading items */}
              {uploading[versionId]?.map((file) => (
                <ReviewableProgressCard
                  key={file.name}
                  {...file}
                  type={'upload'}
                  onRemove={() => handleRemoveUpload(file.name)}
                />
              ))}

              {/* upload button */}
              <Styled.Upload className="upload">
                <span>Drop or click to upload</span>
                <input type="file" multiple onChange={handleInputChange} ref={inputRef} />
              </Styled.Upload>
            </>
          )}
        </Styled.ReviewablesList>
      )}

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
