import { useEffect, useMemo, useState } from 'react'
import { Button } from '@ynput/ayon-react-components'
import * as Styled from './Viewer.styled'
import VersionSelectorTool from '@components/VersionSelectorTool/VersionSelectorTool'
import { useGetViewerReviewablesQuery } from '@queries/review/getReview'
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
    taskId,
    folderId,
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
    useGetViewerReviewablesQuery(
      { projectName, productId, taskId, folderId },
      { skip: !projectName || (!productId && !taskId && !folderId) },
    )

  // This should not return the first reviewable, but there should be reviewable
  // selector in the UI
  const selectedVersion = useMemo(
    () => versionsAndReviewables.find((v) => v.id === versionIds[0]),
    [versionIds, versionsAndReviewables],
  )

  // if no versionIds are provided, select the last version and update the state
  useEffect(() => {
    if (!versionIds.length && !isFetchingReviewables && versionsAndReviewables.length) {
      const lastVersion = versionsAndReviewables[versionsAndReviewables.length - 1]
      if (lastVersion) {
        dispatch(updateSelection({ versionIds: [lastVersion.id] }))
      }
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

  const noVersions = !versionsAndReviewables.length && !isFetchingReviewables

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
  } else if (!isFetchingReviewables) {
    let message = 'No preview available'
    let children = null

    if (noVersions) {
      message = 'This task has published no versions.'
    } else if (!reviewables.length) {
      message = 'This version has no online reviewables.'
      children = (
        <Button onClick={handleUploadButton} icon="upload" variant="filled">
          Upload a file
        </Button>
      )
    } else if (availability === 'conversionRequired') {
      message = 'File not supported and needs conversion'
    }

    viewerComponent = (
      <EmptyPlaceholder icon="hide_image" message={message}>
        {children}
      </EmptyPlaceholder>
    )
  }

  // todo: noVersions modal smaller
  return (
    <Styled.Container>
      <Styled.Header>
        <VersionSelectorTool
          versions={versionsAndReviewables}
          selected={versionIds[0]}
          onChange={handleVersionChange}
        />
        {onClose && <Button onClick={onClose} icon={'close'} className="close" />}
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
        {!noVersions && <ViewerDetailsPanel versionIds={versionIds} projectName={projectName} />}
      </Styled.Content>
    </Styled.Container>
  )
}

export default Viewer
