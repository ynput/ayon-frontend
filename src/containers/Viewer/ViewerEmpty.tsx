import { ReviewableUpload, EmptyPlaceholder } from '@shared/components'
import type { ReviewableResponse } from '@shared/api'
import { useDetailsPanelContext } from '@shared/context'
import * as Styled from './Viewer.styled'

type Props = {
  projectName: string
  productId: string | null
  versionId?: string
  reviewables: ReviewableResponse[]
  noVersions: boolean
  onUpload: () => void
}

const placeholderStyles = {
  position: 'relative',
  transform: 'none',
  top: 'auto',
  left: 'auto',
  paddingBottom: '16px',
} as React.CSSProperties

// what the viewer shows instead of the player when there is nothing it can play
const ViewerEmpty = ({
  projectName,
  productId,
  versionId,
  reviewables,
  noVersions,
  onUpload,
}: Props) => {
  const { viewer, dispatch } = useDetailsPanelContext()

  let message = 'File not supported and needs conversion'
  if (noVersions) message = 'This task has published no versions.'
  else if (!reviewables.length) message = 'This version has no online reviewables.'
  const placeholder = (
    <EmptyPlaceholder icon="hide_image" message={message} style={placeholderStyles} />
  )

  return (
    <Styled.Empty>
      {!noVersions && !reviewables.length ? (
        <ReviewableUpload
          projectName={projectName}
          folderId={viewer?.folderId}
          taskId={viewer?.taskId}
          versionId={versionId}
          productId={productId}
          variant="large"
          onUpload={onUpload}
          dispatch={dispatch}
        >
          {placeholder}
        </ReviewableUpload>
      ) : (
        placeholder
      )}
    </Styled.Empty>
  )
}

export default ViewerEmpty
