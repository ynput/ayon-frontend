import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import { Panel, UserImage } from '@ynput/ayon-react-components'
import Thumbnail from '/src/containers/thumbnail'
import { useRef } from 'react'

const PanelStyled = styled(Panel)`
  padding: 4px;
  background-color: var(--color-grey-01);
  max-height: 400px;
  height: 100%;
  width: 100%;
  min-height: 120px;
  gap: 0;
  /* cursor: pointer; */
  user-select: none;

  footer {
    display: flex;
    justify-content: space-between;
    min-height: 17.5px;
  }

  /* name */
  & > *:nth-child(2) {
    font-weight: bold;
  }

  :hover {
    background-color: var(--color-grey-02);
  }

  /* overflows */
  & > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-height: 17.5px;
  }

  ${({ isLoading }) =>
    isLoading &&
    css`
      opacity: 0.25;

      :hover {
        background-color: var(--color-grey-01);
      }
    `}
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
    top: 4px;
    left: 4px;
    right: 4px;
    height: 25px;

    /* status */
    span:last-child {
      font-variation-settings: 'FILL' 1, 'wght' 100, 'GRAD' 200, 'opsz' 20;
    }
  }
`

const IconStyled = styled.span`
  background-color: var(--color-grey-01);
  width: 25px;
  min-width: 25px;
  max-width: 40px;
  aspect-ratio: 1/1;
  border-radius: 3px;
  overflow: hidden;
  font-size: 20px;
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
  updatedAt,
  projectName,
  subTitle,
  footer,
  profile,
  onClick,
  isLoading,
  isError,
  style,
}) => {
  const ref = useRef()

  // TODO: get full user

  return (
    <PanelStyled ref={ref} onClick={onClick} isLoading={isError || isLoading} style={style}>
      <ThumbnailStyled>
        <Thumbnail
          entityType={thumbnailEntityType}
          entityId={thumbnailEntityId}
          projectName={projectName}
          isLoading={isLoading}
          entityUpdatedAt={updatedAt}
        />
        <div>
          <IconStyled className="material-symbols-outlined">{typeIcon}</IconStyled>
          <IconStyled className="material-symbols-outlined" style={{ color: statusColor }}>
            {statusIcon}
          </IconStyled>
        </div>
      </ThumbnailStyled>
      <span>{name}</span>
      {subTitle && <span>{subTitle}</span>}
      <footer>
        <span>{footer}</span>
        {profile && <UserImage fullName={profile} size={20} />}
      </footer>
    </PanelStyled>
  )
}

EntityGridTile.propTypes = {
  typeIcon: PropTypes.string,
  statusIcon: PropTypes.string,
  statusColor: PropTypes.string,
  name: PropTypes.string,
  onClick: PropTypes.func,
  thumbnailEntityId: PropTypes.string,
  thumbnailEntityType: PropTypes.string,
  subTitle: PropTypes.string,
  footer: PropTypes.string,
  profile: PropTypes.string,
  entityUpdatedAt: PropTypes.string,
}

export default EntityGridTile
