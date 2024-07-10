import { useEffect, useMemo } from 'react'
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

  const versionReviewableIds = selectedVersion?.reviewables?.map((r) => r.fileId) || []

  // if no reviewableIds are provided, select the first reviewable
  useEffect(() => {
    if (
      (!reviewableIds.length ||
        !reviewableIds.every((id: string) => versionReviewableIds.includes(id))) &&
      !isFetchingReviewables &&
      selectedVersion
    ) {
      const firstReviewableId =
        selectedVersion.reviewables && selectedVersion.reviewables[0]?.fileId
      if (firstReviewableId) {
        dispatch(updateSelection({ reviewableIds: [firstReviewableId] }))
      }
    }
  }, [reviewableIds, versionReviewableIds, isFetchingReviewables, selectedVersion, dispatch])

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
      (r) => r.label?.toLowerCase() === currentLabel,
    )?.fileId
    // no matching reviewable? just pick the first one
    if (!newReviewableId)
      newReviewableId = newVersion.reviewables && newVersion.reviewables[0]?.fileId

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

  let viewerComponent
  const availability = selectedReviewable?.availability
  const isReady = availability === 'ready'

  if (selectedReviewable?.mimetype.includes('video') && isReady) {
    viewerComponent = (
      <ViewerPlayer
        projectName={projectName}
        reviewable={selectedReviewable}
        onUpload={handleUploadButton}
        autoplay={quickView}
      />
    )
  } else if (selectedReviewable?.mimetype.includes('image') && isReady) {
    viewerComponent = (
      <Styled.Image
        src={`/api/projects/${projectName}/files/${selectedReviewable.fileId}`}
        alt={selectedReviewable.label || selectedReviewable.filename}
      />
    )
  } else {
    viewerComponent = (
      <EmptyPlaceholder
        icon="hide_image"
        message={
          availability === 'needs_conversion'
            ? 'File not supported and needs conversion'
            : 'No preview available'
        }
      />
    )
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
          reviewables={selectedVersion?.reviewables || []}
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
