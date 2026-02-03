import { FC, useRef, useState, useEffect, CSSProperties } from 'react'
import { Image } from './Viewer.styled'
import { useViewer } from '@context/ViewerContext'
import styled from 'styled-components'
import { AnnotationsContainerDimensions } from './'

const AnnotationsContainer = styled.div`
  position: absolute;
  inset: 0;
`

interface ViewerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  reviewableId: string
  src: string
  alt: string
}

const ViewerImage: FC<ViewerImageProps> = ({ reviewableId, src, alt, ...props }) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const [containerDims, setContainerDims] = useState<AnnotationsContainerDimensions | null>(null)
  const [parentDims, setParentDims] = useState<{ width: number; height: number } | null>(null)
  const measureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!measureRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setParentDims({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(measureRef.current)
    return () => observer.disconnect()
  }, [])

  const {
    createToolbar,
    AnnotationsEditorProvider,
    AnnotationsCanvas,
    isLoaded: isLoadedAnnotations,
  } = useViewer()

  const imageAspectRatio = containerDims
    ? (containerDims.width || 0) / (containerDims.height || 1)
    : 0
  const parentAspectRatio = parentDims ? parentDims.width / (parentDims.height || 1) : 0

  // If the images aspect ratio is less than the parent element aspect ratio then the width should be auto and height 100%.
  const useHeight = imageAspectRatio < parentAspectRatio
  const aspectRatio = `${containerDims?.width} / ${containerDims?.height}`

  const containerStyle: CSSProperties = {
    position: 'relative',
    aspectRatio,
    width: useHeight ? 'auto' : '100%',
    height: useHeight ? '100%' : 'auto',
  }

  return (
    <div
      ref={measureRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <AnnotationsEditorProvider
        backgroundRef={imageRef}
        containerDimensions={containerDims}
        pageNumber={1}
        id={reviewableId}
        src={src}
        mediaType="image"
      >
        <div style={containerStyle}>
          <Image
            ref={imageRef}
            src={src}
            alt={alt}
            {...props}
            onLoad={({ target }) => {
              const image = target as HTMLImageElement
              setContainerDims({ width: image.naturalWidth, height: image.naturalHeight })
            }}
          />
          {AnnotationsCanvas && isLoadedAnnotations && containerDims && (
            <AnnotationsContainer>
              <AnnotationsCanvas {...containerDims} />
            </AnnotationsContainer>
          )}
        </div>
        {createToolbar()}
      </AnnotationsEditorProvider>
    </div>
  )
}

export default ViewerImage
