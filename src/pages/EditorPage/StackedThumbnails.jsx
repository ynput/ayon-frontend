import React from 'react'
import styled, { css } from 'styled-components'
import Thumbnail from '@/containers/thumbnail'
import { useSelector } from 'react-redux'

const StackedStyled = styled.div`
  display: flex;
  z-index: 10;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  min-width: min-content;
  & > * {
    margin: unset;
    aspect-ratio: 1;
    width: 40px;
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

  img {
    object-fit: cover;
  }

  & > * + * {
    margin-left: ${({ length }) => `${Math.max(-20, -length * 1.5 - 8)}px`};
  }

  height: 100%;
`

const StackedThumbnails = ({ thumbnails = [], isLoading, projectName, className, ...props }) => {
  const projectName2 = projectName || useSelector((state) => state.project.name)
  // limit to 5 users
  thumbnails = thumbnails.slice(0, 5)

  return (
    <StackedStyled length={thumbnails.length} className={className + ' stacked-thumbnails'}>
      {thumbnails.map((thumb, i) =>
        thumb ? (
          <Thumbnail
            projectName={projectName2}
            entityType={thumb.type}
            entityId={thumb.id}
            key={thumb.id || thumb.src || i}
            style={{ zIndex: -i }}
            entityUpdatedAt={thumb.updatedAt}
            isLoading={isLoading}
            src={thumb.src}
            isStacked={thumbnails.length > 1}
            {...thumb}
            {...props}
          />
        ) : null,
      )}
    </StackedStyled>
  )
}

export default StackedThumbnails
