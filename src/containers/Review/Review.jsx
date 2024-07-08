import { useEffect, useMemo } from 'react'
import { Button } from '@ynput/ayon-react-components'
import * as Styled from './Review.styled'
import VersionSelectorTool from '@components/VersionSelectorTool/VersionSelectorTool'
import { useGetReviewablesForProductQuery } from '@queries/review/getReview'
import { useDispatch, useSelector } from 'react-redux'
import { toggleUpload, updateSelection } from '@state/review'
import ReviewDetailsPanel from './ReviewDetailsPanel'
import ReviewPlayer from './ReviewPlayer'
import ReviewablesSelector from '@/components/ReviewablesSelector'
import { updateDetailsPanelTab } from '@/features/details'
import EmptyPlaceholder from '@/components/EmptyPlaceholder/EmptyPlaceholder'

const Review = ({ onClose }) => {
  const {
    productId,
    projectName,
    versionIds = [],
    reviewableIds = [],
  } = useSelector((state) => state.review)

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

  const versionReviewableIds = selectedVersion?.reviewables.map((r) => r.activityId) || []

  // if no reviewableIds are provided, select the first reviewable
  useEffect(() => {
    if (
      (!reviewableIds.length || !reviewableIds.every((id) => versionReviewableIds.includes(id))) &&
      !isFetchingReviewables &&
      selectedVersion
    ) {
      const firstReviewableId = selectedVersion.reviewables[0]?.activityId
      if (firstReviewableId) {
        dispatch(updateSelection({ reviewableIds: [firstReviewableId] }))
      }
    }
  }, [reviewableIds, versionReviewableIds, isFetchingReviewables, selectedVersion, dispatch])

  const selectedReviewable = useMemo(
    // for now we only support one reviewable
    () => selectedVersion?.reviewables.find((r) => r.activityId === reviewableIds[0]),
    [reviewableIds, selectedVersion],
  )

  const handleVersionChange = (versionId) => {
    // try and find a matching reviewable in the new version with the same label as the current reviewable
    const currentLabel = selectedReviewable?.label?.toLowerCase()

    const newVersion = versionsAndReviewables.find((v) => v.id === versionId)

    // no version? that's weird
    if (!newVersion) return console.error('No version found for id', versionId)

    let newReviewableId = newVersion.reviewables.find(
      (r) => r.label?.toLowerCase() === currentLabel,
    )?.activityId
    // no matching reviewable? just pick the first one
    if (!newReviewableId) newReviewableId = newVersion.reviewables[0]?.activityId

    dispatch(updateSelection({ versionIds: [versionId], reviewableIds: [newReviewableId] }))
  }

  const handleReviewableChange = (reviewableId) => {
    dispatch(updateSelection({ reviewableIds: [reviewableId] }))
  }

  const handleUploadButton = () => {
    // switch to files tab
    dispatch(updateDetailsPanelTab({ scope: 'review', tab: 'files' }))
    // open the file dialog
    dispatch(toggleUpload(true))
  }

  const isLoadingAll = isFetchingReviewables

  let viewerComponent
  const availability = selectedReviewable?.availability
  const isReady = availability === 'ready'

  if (selectedReviewable?.mimetype.includes('video') && isReady) {
    console.log(selectedReviewable)
    viewerComponent = (
      <ReviewPlayer
        projectName={projectName}
        reviewable={selectedReviewable}
        onUpload={handleUploadButton}
      />
    )
  } else if (selectedReviewable?.mimetype.includes('image') && isReady) {
    viewerComponent = (
      <Styled.Image
        src={`/api/projects/${projectName}/files/${selectedReviewable.fileId}`}
        alt={selectedReviewable.label || selectedReviewable.name}
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

  return (
    <Styled.Container>
      <Styled.Header>
        <VersionSelectorTool
          versions={versionsAndReviewables}
          selected={versionIds[0]}
          isLoading={isLoadingAll}
          onChange={handleVersionChange}
        />
        {onClose && <Button onClick={onClose} icon={'close'} />}
      </Styled.Header>
      <Styled.Content>
        <Styled.ViewerWrapper>{viewerComponent}</Styled.ViewerWrapper>
        <ReviewablesSelector
          reviewables={selectedVersion?.reviewables}
          selected={reviewableIds}
          onChange={handleReviewableChange}
          onUpload={handleUploadButton}
          projectName={projectName}
        />
        <ReviewDetailsPanel versionIds={versionIds} projectName={projectName} />
      </Styled.Content>
    </Styled.Container>
  )
}

export default Review
