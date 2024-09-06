import React, { useContext } from 'react'
import styled, { css } from 'styled-components'
import Thumbnail from '@components/Thumbnail'
import { useSelector } from 'react-redux'
import clsx from 'clsx'
import { ThumbnailUploadContext } from '@components/EntityThumbnailUploader/ThumbnailUploaderProvider'

const StackedStyled = styled.div`
  display: flex;
  z-index: 10;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  min-width: min-content;
  cursor: pointer;

  &.stacking {
    & > * {
      margin: unset;
      aspect-ratio: 1;
      border: solid 2px var(--md-sys-color-outline-variant);
      border-radius: 8px;

      span {
        font-size: 24px;
      }

      ${({ length }) =>
        length > 1 &&
        css`
          :not(:last-child) {
            box-shadow: 0 0 4px 0px black;
          }
        `}
    }

    /* create stacked effect */
    & > * + * {
      margin-left: ${({ length }) => `${Math.max(-20, -length * 1.5 - 8)}px`};
    }
  }
`

const StackedThumbnails = ({
  thumbnails = [],
  isLoading,
  projectName,
  className,
  style,
  ...props
}) => {
  const { onContextMenu } = useContext(ThumbnailUploadContext)
  const projectName2 = projectName || useSelector((state) => state.project.name)
  // limit to 5 users
  thumbnails = thumbnails.slice(0, 5)
  const isStacking = thumbnails.length > 1

  return (
    <StackedStyled
      length={thumbnails.length}
      className={clsx('stacked-thumbnails', className, { stacking: isStacking })}
    >
      {thumbnails.map((thumb, i) =>
        thumb ? (
          <Thumbnail
            projectName={projectName2}
            entityType={thumb.type}
            entityId={thumb.id}
            key={thumb.id || thumb.src || i}
            style={{ ...style, zIndex: -i }}
            entityUpdatedAt={thumb.updatedAt}
            isLoading={isLoading}
            src={thumb.src}
            onContextMenu={onContextMenu}
            {...props}
          />
        ) : null,
      )}
    </StackedStyled>
  )
}

export default StackedThumbnails
