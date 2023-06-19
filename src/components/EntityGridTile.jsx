import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import { Panel, UserImage } from '@ynput/ayon-react-components'
import Thumbnail from '/src/containers/thumbnail'
import { useRef } from 'react'
import getShimmerStyles from '../styles/getShimmerStyles'

const PanelStyled = styled(Panel)`
  padding: 4px;
  background-color: var(--color-grey-01);
  max-height: 400px;
  height: 100%;
  width: 100%;
  min-height: 120px;
  gap: 0;
  overflow: hidden;

  user-select: none;
  transition: opacity 0.3s;

  & > * {
    z-index: 10;
  }

  /* add point if onClick */
  ${({ onClick }) =>
    onClick &&
    css`
      cursor: pointer;
    `}

  footer {
    display: flex;
    justify-content: space-between;
    min-height: 17.5px;
    padding: 0 4px;
    overflow: hidden;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
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

  /* border: 1px solid transparent; */
  /* when selected */
  ${({ $isSelected }) =>
    $isSelected &&
    css`
      /* border: 0.15rem solid var(--color-hl-00); */
      background-color: var(--color-row-hl);
      /* remove hover */
      :hover {
        background-color: var(--color-row-hl);
      }
    `}

  /* when in loading state */
  ${({ $isLoading }) =>
    $isLoading &&
    css`
      opacity: 0.7;

      :hover {
        background-color: var(--color-grey-01);
      }

      .thumbnail {
        background-color: var(--color-grey-00);
      }

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        ${getShimmerStyles('transparent')}
        opacity: 0.5;
        transition: opacity 0.3s;
        z-index: 10;
      }
    `}

  /* is error styles */
    ${({ $isError }) =>
    $isError &&
    css`
      /* fade tile */
      opacity: 0.5;
      /* hide shimmer */
      &::after {
        opacity: 0;
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
  selected,
  ...props
}) => {
  const ref = useRef()

  // if is loading return shimmer skeleton
  if (isLoading || isError)
    return (
      <PanelStyled
        ref={ref}
        $isLoading={isLoading || isError}
        $isError={isError}
        {...props}
        className="skeleton"
      >
        <ThumbnailStyled>
          <Thumbnail isLoading className={'thumbnail'} />
          <div>
            <IconStyled className="material-symbols-outlined"></IconStyled>
            <IconStyled className="material-symbols-outlined"></IconStyled>
          </div>
        </ThumbnailStyled>
        <span></span>
        <footer></footer>
      </PanelStyled>
    )

  return (
    <PanelStyled
      ref={ref}
      onClick={onClick}
      $isSelected={selected}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(e)}
      {...props}
    >
      <ThumbnailStyled>
        <Thumbnail
          entityType={thumbnailEntityType}
          entityId={thumbnailEntityId}
          projectName={projectName}
          entityUpdatedAt={updatedAt}
          className={'thumbnail'}
        />
        <div>
          <IconStyled className="material-symbols-outlined">{typeIcon}</IconStyled>
          <IconStyled className="material-symbols-outlined" style={{ color: statusColor }}>
            {statusIcon}
          </IconStyled>
        </div>
      </ThumbnailStyled>
      <span style={{ padding: '0 4px' }}>{name}</span>
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
