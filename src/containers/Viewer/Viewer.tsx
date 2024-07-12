import { useEffect, useMemo, useState } from 'react'
import { Button } from '@ynput/ayon-react-components'
import * as Styled from './Viewer.styled'
import VersionSelectorTool from '@components/VersionSelectorTool/VersionSelectorTool'
import { useGetReviewablesForProductQuery } from '@queries/review/getReview'
import { useDispatch, useSelector } from 'react-redux'
import { toggleFullscreen, toggleUpload, updateSelection } from '@state/viewer'
import ViewerDetailsPanel from './ViewerDetailsPanel'
import ViewerPlayer from './ViewerPlayer'
import ReviewablesSelector from '@/components/ReviewablesSelector'
import { updateDetailsPanelTab } from '@/features/details'
import EmptyPlaceholder from '@/components/EmptyPlaceholder/EmptyPlaceholder'
import { $Any } from '@/types'
import { useFullScreenHandle } from 'react-full-screen'
import { getGroupedReviewables } from '../ReviewablesList/getGroupedReviewables'

interface ViewerProps {
  onClose?: () => void
  canOpenInNew?: boolean
}

const Viewer = ({ onClose }: ViewerProps) => {
  const {
    productId,
    projectName,
    versionIds = [],
    reviewableIds = [],
    fullscreen,
    quickView,
  } = useSelector((state: $Any) => state.viewer)

  const [autoPlay, setAutoPlay] = useState(quickView)

  const dispatch = useDispatch()

  // new query: returns all reviewables for a product
  const { data: versionsAndReviewables = [], isFetching: isFetchingReviewables } =
    useGetReviewablesForProductQuery({ projectName, productId: productId }, { skip: !productId })

  // This should not return the first reviewable, but there should be reviewable
  // selector in the UI
  const selectedVersion = useMemo(
    () => versionsAndReviewables.find((v) => v.id === versionIds[0]),
    [versionIds, versionsAndReviewables],
  )

  // if no versionIds are provided, select the last version and update the state
  useEffect(() => {
    if (!versionIds.length && !isFetchingReviewables && versionsAndReviewables.length) {
      const lastVersionId = versionsAndReviewables[versionsAndReviewables.length - 1].id
      dispatch(updateSelection({ versionIds: [lastVersionId] }))
    }
  }, [versionIds, isFetchingReviewables, versionsAndReviewables, dispatch])

  const versionReviewableIds = selectedVersion?.reviewables?.map((r) => r.fileId) || []

  // if no reviewableIds are provided, select the first playable reviewable
  useEffect(() => {
    if (
      (!reviewableIds.length ||
        !reviewableIds.every((id: string) => versionReviewableIds.includes(id))) &&
      !isFetchingReviewables &&
      selectedVersion
    ) {
      const firstReviewableId = selectedVersion.reviewables?.find(
        (r) => r.availability === 'ready',
      )?.fileId
      if (firstReviewableId) {
        dispatch(updateSelection({ reviewableIds: [firstReviewableId] }))
      }
    }
  }, [reviewableIds, versionReviewableIds, isFetchingReviewables, selectedVersion, dispatch])

  // disable quickView straight away (if it was enabled)
  // NOTE: this will change with Quick View task
  useEffect(() => {
    if (quickView) {
      dispatch(updateSelection({ quickView: false }))
    }
  }, [quickView, dispatch])

  const selectedReviewable = useMemo(
    // for now we only support one reviewable
    () => selectedVersion?.reviewables?.find((r) => r.fileId === reviewableIds[0]),
    [reviewableIds, selectedVersion],
  )

  const handleVersionChange = (versionId: string) => {
    // try and find a matching reviewable in the new version with the same label as the current reviewable
    const currentLabel = selectedReviewable?.label?.toLowerCase()

    const newVersion = versionsAndReviewables.find((v) => v.id === versionId)

    // no version? that's weird
    if (!newVersion) return console.error('No version found for id', versionId)

    let newReviewableId = newVersion.reviewables?.find(
      (r) => r.label?.toLowerCase() === currentLabel && r.availability === 'ready',
    )?.fileId

    // no matching reviewable? just pick the first ready one
    if (!newReviewableId)
      newReviewableId = newVersion.reviewables?.find((r) => r.availability === 'ready')?.fileId

    dispatch(updateSelection({ versionIds: [versionId], reviewableIds: [newReviewableId] }))
  }

  const handleReviewableChange = (reviewableId: string) => {
    dispatch(updateSelection({ reviewableIds: [reviewableId] }))
  }

  const handleUploadButton = () => {
    // switch to files tab
    dispatch(updateDetailsPanelTab({ scope: 'review', tab: 'files' }))
    // open the file dialog
    dispatch(toggleUpload(true))
  }

  const handlePlayReviewable = () => {
    // reset auto play
    // auto play should only be enabled on first video load
    setAutoPlay(false)
  }

  const handle = useFullScreenHandle()

  useEffect(() => {
    if (fullscreen) {
      // check if it's already open
      if (!handle.active) handle.enter()
    } else {
      if (handle.active) handle.exit()
    }
  }, [handle, fullscreen])

  const fullScreenChange = (state: boolean) => {
    // when closing, ensure the state is updated
    if (!state) {
      dispatch(toggleFullscreen({ fullscreen: false }))
    }
  }

  const reviewables = selectedVersion?.reviewables || []

  const { optimized, unoptimized } = useMemo(
    () => getGroupedReviewables(reviewables as any),
    [reviewables],
  )

  const shownOptions = [...optimized, ...unoptimized]

  let viewerComponent
  const availability = selectedReviewable?.availability
  const isPlayable = availability !== 'conversionRequired'

  if (selectedReviewable?.mimetype.includes('video') && isPlayable) {
    viewerComponent = (
      <ViewerPlayer
        projectName={projectName}
        reviewable={selectedReviewable}
        onUpload={handleUploadButton}
        autoplay={autoPlay}
        onPlay={handlePlayReviewable}
      />
    )
  } else if (selectedReviewable?.mimetype.includes('image') && isPlayable) {
    viewerComponent = (
      <Styled.Image
        src={`/api/projects/${projectName}/files/${selectedReviewable.fileId}`}
        alt={selectedReviewable.label || selectedReviewable.filename}
      />
    )
  } else if (selectedReviewable) {
    viewerComponent = (
      <EmptyPlaceholder
        icon="hide_image"
        message={
          availability === 'conversionRequired'
            ? 'File not supported and needs conversion'
            : 'No preview available'
        }
      />
    )
  } else if (!selectedReviewable || !reviewables.length) {
    viewerComponent = (
      <EmptyPlaceholder icon="hide_image" message="No reviewables available">
        <Button onClick={handleUploadButton} icon="upload" variant="filled">
          Upload a file
        </Button>
      </EmptyPlaceholder>
    )
  }

  return (
    <Styled.Container>
      <Styled.Header>
        <VersionSelectorTool
          versions={versionsAndReviewables}
          selected={versionIds[0]}
          onChange={handleVersionChange}
        />
        {onClose && <Button onClick={onClose} icon={'close'} />}
      </Styled.Header>
      <Styled.Content>
        <Styled.FullScreenWrapper handle={handle} onChange={fullScreenChange}>
          {viewerComponent}
        </Styled.FullScreenWrapper>
        <ReviewablesSelector
          reviewables={shownOptions}
          selected={reviewableIds}
          onChange={handleReviewableChange}
          onUpload={handleUploadButton}
          projectName={projectName}
        />
        <ViewerDetailsPanel versionIds={versionIds} projectName={projectName} />
      </Styled.Content>
    </Styled.Container>
  )
}

export default Viewer
