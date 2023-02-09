import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Panel } from '@ynput/ayon-react-components'
import UserImage from '/src/pages/settings/users/UserImage'
import Thumbnail from '../containers/thumbnail'

const PanelStyled = styled(Panel)`
  padding: 8px;
  background-color: var(--color-grey-01);
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 140/127;
  gap: 0;

  footer {
    display: flex;
    justify-content: space-between;
  }

  /* name */
  & > *:nth-child(2) {
    font-weight: bold;
  }

  /* overflows */
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const ThumbnailStyled = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  padding-bottom: 4px;

  /* thumbnail */
  & > div:first-child {
    aspect-ratio: unset;
    height: 100%;
    max-width: unset;

    span {
      font-size: 25px;
    }

    img {
      object-fit: cover;
    }
  }

  /* icons */
  div:last-child {
    display: flex;
    justify-content: space-between;
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    height: 25px;

    /* status */
    span:last-child {
      font-variation-settings: 'FILL' 1, 'wght' 100, 'GRAD' 200, 'opsz' 20;
    }
  }
`

const IconStyled = styled.span`
  background-color: var(--color-grey-01);
  width: 17%;
  min-width: 25px;
  max-width: 40px;
  aspect-ratio: 1/1;
  border-radius: 3px;
  overflow: hidden;
  font-size: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: min-content;
  user-select: none;
`

const EntityGridTile = ({
  typeIcon,
  statusIcon,
  statusColor,
  name,
  thumbnailEntityId,
  thumbnailEntityType,
  projectName,
  subTitle,
  footer,
  profile,
}) => {
  return (
    <PanelStyled>
      <ThumbnailStyled>
        <Thumbnail
          entityType={thumbnailEntityType}
          entityId={thumbnailEntityId}
          projectName={projectName}
        />
        <div>
          <IconStyled className="material-symbols-outlined">{typeIcon}</IconStyled>
          <IconStyled className="material-symbols-outlined" style={{ color: statusColor }}>
            {statusIcon}
          </IconStyled>
        </div>
      </ThumbnailStyled>
      <span>{name}</span>
      <span>{subTitle}</span>
      <footer>
        <span>{footer}</span>
        {profile && <UserImage fullName="Test Test" size={20} />}
      </footer>
    </PanelStyled>
  )
}

EntityGridTile.propTypes = {
  typeIcon: PropTypes.string,
  statusIcon: PropTypes.string,
  statusColor: PropTypes.string,
  name: PropTypes.string,

  thumbnailEntityId: PropTypes.string,
  thumbnailEntityType: PropTypes.string,
  projectName: PropTypes.string,
  subTitle: PropTypes.string,
  footer: PropTypes.string,
  profile: PropTypes.string,
}

export default EntityGridTile
