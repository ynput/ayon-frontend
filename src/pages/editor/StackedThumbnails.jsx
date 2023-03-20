import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import Thumbnail from '/src/containers/thumbnail'
import { useSelector } from 'react-redux'

const StackedStyled = styled.div`
  display: flex;
  z-index: 10;
  position: relative;
  overflow: hidden;
  border-radius: 6px;
  min-width: min-content;
  & > * {
    margin: unset;
    aspect-ratio: 1;
    width: 40px;
    border: solid 1px var(--color-grey-06);
    border-radius: 6px;

    span {
      font-size: 20px;
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

const StackedThumbnails = ({ thumbnails = [] }) => {
  const projectName = useSelector((state) => state.project.name)
  // limit to 5 users
  thumbnails = thumbnails.slice(0, 5)

  return (
    <StackedStyled length={thumbnails.length}>
      {thumbnails.map(
        (thumb, i) =>
          thumb && (
            <Thumbnail
              projectName={projectName}
              entityType={thumb.type}
              entityId={thumb.id}
              key={thumb.id}
              style={{ zIndex: -i }}
            />
          ),
      )}
    </StackedStyled>
  )
}

StackedThumbnails.propTypes = {
  thumbnails: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
}

export default StackedThumbnails
