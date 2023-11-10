import React from 'react'
import PropTypes from 'prop-types'
import Thumbnail from '/src/containers/thumbnail'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'
import { useEffect } from 'react'

const GalleryStyled = styled.div`
  display: flex;
  z-index: 10;
  position: relative;
  overflow: hidden;
  gap: 16px;
  align-items: center;
  justify-content: center;
  min-height: 120px;

  & > span {
    font-size: 30px;
  }
`

const ImageStyled = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  width: 100%;
  max-width: 250px;
`

const ThumbnailGallery = ({ thumbnails = [], type, isLoading }) => {
  const projectName = useSelector((state) => state.project.name)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [thumbnails, type])

  const handleClick = (i) => {
    const newIndex = index + i
    if (newIndex < 0) {
      setIndex(thumbnails.length - 1)
    } else if (newIndex >= thumbnails.length) {
      setIndex(0)
    } else {
      setIndex(newIndex)
    }
  }

  const isMultiple = thumbnails.length > 1

  return (
    <GalleryStyled>
      {isMultiple && <Button icon="chevron_left" onClick={() => handleClick(-1)} variant="text" />}
      {thumbnails[index] && (
        <ImageStyled>
          <Thumbnail
            uploadEntities={thumbnails}
            entityType={type}
            entityId={thumbnails[index].id}
            projectName={projectName}
            style={{
              margin: 'unset',
            }}
            entityUpdatedAt={thumbnails[index].updatedAt}
            isLoading={isLoading}
            shimmer
          />
          <span style={{ opacity: isMultiple ? 1 : 0 }}>{thumbnails[index].name}</span>
        </ImageStyled>
      )}
      {isMultiple && <Button icon="chevron_right" onClick={() => handleClick(1)} variant="text" />}
    </GalleryStyled>
  )
}

ThumbnailGallery.propTypes = {
  thumbnails: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      updatedAt: PropTypes.string.isRequired,
    }),
  ),
}

export default ThumbnailGallery
