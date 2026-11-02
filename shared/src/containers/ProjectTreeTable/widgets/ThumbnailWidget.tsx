import { PlayableIcon } from '@shared/components/PlayableIcon/PlayableIcon'
import { FC, memo } from 'react'
import styled from 'styled-components'
import { getEntityFilmstripUrl, getEntityThumbnailUrl } from '@shared/util'
import { Filmstrip } from '@shared/components/Filmstrip'

const Wrapper = styled.div`
  position: absolute;
  inset: 0;
  padding: 4px;
  display: flex;
`

const Inner = styled.div`
  position: relative;
  max-height: 100%;
  height: 100%;
  width: 100%;
  //aspect-ratio: 1.77;

  overflow: hidden;

  /* the hover-scrub filmstrip replaces the static image */
  &[data-filmstrip-active] > img {
    visibility: hidden;
  }
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
  entityId?: string
  thumbnailHash?: string
  icon?: string | null
  isPlayable?: boolean
  url?: string // override url for specific thumbnail urls
}

const ThumbnailWidgetWrapper: FC<ThumbnailWidgetProps> = ({
  projectName,
  entityType,
  entityId,
  thumbnailHash,
  icon,
  isPlayable,
  url,
  id,
  ...props
}) => {
  // TODO: products have no thumbnail endpoint, resolve to the featured version's thumbnail instead
  const valid = projectName && entityType && entityId && entityType !== 'product'
  const thumbnailUrl = getEntityThumbnailUrl({ projectName, entityType, entityId, thumbnailHash })

  return (
    <Wrapper className="thumbnail-widget" key={url || thumbnailUrl} id={id}>
      <Inner {...props}>
        {valid && <Image src={url || thumbnailUrl || undefined} />}
        {valid && isPlayable && (
          <Filmstrip
            src={getEntityFilmstripUrl({ projectName, entityType, entityId, thumbnailHash })}
            fit="contain"
            // same level as the image, so the playable icon stays on top
            style={{ zIndex: 20 }}
          />
        )}
      </Inner>
      {isPlayable && <StyledPlayableIcon />}
    </Wrapper>
  )
}

export const ThumbnailWidget = memo(ThumbnailWidgetWrapper)
