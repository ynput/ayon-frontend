import ReviewableUpload from '@containers/ReviewablesList/ReviewablesUpload'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'

import ViewerPlayer from './ViewerPlayer'
import * as Styled from './Viewer.styled'
import { useState } from 'react'
import { ReviewableResponse } from '@queries/review/types'
import ViewerImage from './ViewerImage'

interface ViewerProps {
  projectName: string | null
  productId: string | null
  reviewables: ReviewableResponse[]
  selectedReviewable: ReviewableResponse | undefined
  selectedVersionId?: string
  versionIds: string[]
  versionReviewableIds: string[]
  isFetchingReviewables: boolean
  noVersions: boolean
  quickView: boolean
  onUpload: (toggleNativeFileUpload: boolean) => () => void
}

const ViewerComponent = ({
  projectName,
  productId,
  reviewables,
  selectedReviewable,
  versionIds,
  versionReviewableIds,
  noVersions,
  isFetchingReviewables,
  quickView,
  onUpload,
}: ViewerProps) => {
  const [autoPlay, setAutoPlay] = useState(quickView)

  const availability = selectedReviewable?.availability
  const isPlayable = availability !== 'conversionRequired'

  const handlePlayReviewable = () => {
    // Reset auto play. Auto play should only be enabled on first video load
    setAutoPlay(false)
  }

  if (selectedReviewable?.mimetype.includes('video') && isPlayable && projectName) {
    return (
      <>
        <ViewerPlayer
          projectName={projectName}
          reviewable={selectedReviewable}
          onUpload={onUpload(true)}
          autoplay={autoPlay}
          onPlay={handlePlayReviewable}
        />
      </>
    )
  }

  if (selectedReviewable?.mimetype.includes('image') && isPlayable) {
    return (
      <ViewerImage
        reviewableId={selectedReviewable.activityId}
        src={`/api/projects/${projectName}/files/${selectedReviewable.fileId}`}
        alt={selectedReviewable.label || selectedReviewable.filename}
      />
    )
  }

  if (!isFetchingReviewables && versionReviewableIds?.length === 0) {
    let message = 'No preview available'
    let canUploadReviewable = false

    if (noVersions) {
      message = 'This task has published no versions.'
    } else if (!reviewables.length) {
      message = 'This version has no online reviewables.'
      canUploadReviewable = true
    } else if (availability === 'conversionRequired') {
      message = 'File not supported and needs conversion'
    }
    const placeholderStyles = {
      position: 'relative',
      transform: 'none',
      top: 'auto',
      left: 'auto',
      paddingBottom: '16px',
    } as React.CSSProperties

    if (!canUploadReviewable) {
      return (
        <Styled.EmptyPlaceholderWrapper>
          <EmptyPlaceholder icon="hide_image" message={message} style={placeholderStyles} />
        </Styled.EmptyPlaceholderWrapper>
      )
    }

    return (
      <ReviewableUpload
        projectName={projectName}
        versionId={versionIds[0]}
        productId={productId}
        variant="large"
        onUpload={onUpload(false)}
      >
        <EmptyPlaceholder icon="hide_image" message={message} style={placeholderStyles} />
      </ReviewableUpload>
    )
  }

  return null
}

export default ViewerComponent
