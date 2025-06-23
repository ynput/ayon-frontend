import { PlayableIcon } from '@shared/components/PlayableIcon/PlayableIcon'
import { Icon } from '@ynput/ayon-react-components'
import { FC, memo } from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  position: absolute;
  inset: 0;
  padding: 4px;
`

const Inner = styled.div`
  position: relative;
  max-height: 100%;
  height: auto;
  width: 100%;
  aspect-ratio: 1.77;

  border-radius: 2px;
  overflow: hidden;
`

const Image = styled.img`
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 20;
`

const StyledPlayableIcon = styled(PlayableIcon)`
  right: 5px;
  top: 5px;
`

interface ThumbnailWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  projectName: string
  entityType: string
  entityId: string
  updatedAt?: string
  icon?: string | null
  isPlayable?: boolean
}

const ThumbnailWidgetWrapper: FC<ThumbnailWidgetProps> = ({
  projectName,
  entityType,
  entityId,
  updatedAt,
  icon,
  isPlayable,
  ...props
}) => {
  const valid = projectName && entityType && entityId && updatedAt
  const url =
    projectName &&
    `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail?updatedAt=${updatedAt}`

  return (
    <Wrapper className="thumbnail-widget" key={url}>
      <Inner {...props}>{valid && <Image src={url} />}</Inner>
      {isPlayable && <StyledPlayableIcon />}
    </Wrapper>
  )
}

export const ThumbnailWidget = memo(ThumbnailWidgetWrapper)
