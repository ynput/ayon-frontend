import { ReviewableUpload, EmptyPlaceholder } from '@shared/components'
import type { ReviewableResponse } from '@shared/api'

import ViewerPlayer from './ViewerPlayer'
import * as Styled from './Viewer.styled'
import { useState } from 'react'
import ViewerImage from './ViewerImage'
import { useDetailsPanelContext } from '@shared/context'

interface ViewerProps {
  projectName: string | null
  productId: string | null
  reviewables: ReviewableResponse[]
  selectedReviewable: ReviewableResponse | undefined
  selectedVersionId?: string
  versionIds: string[]
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
  noVersions,
  isFetchingReviewables,
  quickView,
  onUpload,
}: ViewerProps) => {
  const { viewer, dispatch } = useDetailsPanelContext()

  const [autoPlay, setAutoPlay] = useState(quickView)

  const availability = selectedReviewable?.availability
  const isPlayable = availability !== 'conversionRequired'
  // when no reviewable is selected, the Viewer selects the first of these by itself
  const hasPlayableReviewable = reviewables.some((r) =>
    ['ready', 'conversionRecommended'].includes(r.availability || ''),
  )

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

  // nothing to show: no reviewables, the selected one cannot be played, or none of them can
  if (!isFetchingReviewables && (selectedReviewable || !hasPlayableReviewable)) {
    let message = 'No preview available'
    let canUploadReviewable = false

    if (noVersions) {
      message = 'This task has published no versions.'
    } else if (!reviewables.length) {
      message = 'This version has no online reviewables.'
      canUploadReviewable = true
    } else if (!isPlayable || !hasPlayableReviewable) {
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
        folderId={viewer?.folderId}
        taskId={viewer?.taskId}
        versionId={versionIds[0]}
        productId={productId}
        variant="large"
        onUpload={onUpload(false)}
        dispatch={dispatch}
      >
        <EmptyPlaceholder icon="hide_image" message={message} style={placeholderStyles} />
      </ReviewableUpload>
    )
  }

  return null
}

export default ViewerComponent
