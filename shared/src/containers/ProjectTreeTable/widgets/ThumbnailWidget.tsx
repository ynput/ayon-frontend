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

  background-color: var(--md-sys-color-surface-container-lowest);
  border-radius: 2px;
  overflow: hidden;
`

const Image = styled.img`
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 20;
`

const StyledIcon = styled(Icon)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
`

interface ThumbnailWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  projectName: string
  entityType: string
  entityId: string
  updatedAt?: string
  icon?: string | null
}

const ThumbnailWidgetWrapper: FC<ThumbnailWidgetProps> = ({
  projectName,
  entityType,
  entityId,
  updatedAt,
  icon,
  ...props
}) => {
  const valid = projectName && entityType && entityId && updatedAt
  const url =
    projectName &&
    `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail?updatedAt=${updatedAt}`

  return (
    <Wrapper className="thumbnail-widget" key={url}>
      <Inner {...props}>
        {icon && <StyledIcon icon={icon} />}
        {valid && <Image src={url} />}
      </Inner>
    </Wrapper>
  )
}

export const ThumbnailWidget = memo(ThumbnailWidgetWrapper)
