import { FC, useRef, useState } from 'react'
import { Image } from './Viewer.styled'
import { useViewer } from '@context/viewerContext'
import styled from 'styled-components'
import { AnnotationsContainerDimensions } from './hooks/useViewerAnnotations'

const AnnotationsContainer = styled.div`
  position: absolute;
`

interface ViewerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  reviewableId: string
  src: string
  alt: string
}

const ViewerImage: FC<ViewerImageProps> = ({ reviewableId, src, alt, ...props }) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const [containerDimensions, setContainerDimensions] = useState<AnnotationsContainerDimensions | null>(null)

  const {
    createToolbar,
    AnnotationsProvider,
    AnnotationsCanvas,
    isLoaded: isLoadedAnnotations,
    state: { annotations, addAnnotation },
  } = useViewer()

  return (
    <AnnotationsProvider
      backgroundRef={imageRef}
      containerDimensions={containerDimensions}
      pageNumber={1}
      onAnnotationsChange={addAnnotation}
      annotations={annotations}
      id={reviewableId}
      src={src}
    >
      <div style={{ position: 'relative' }}>
        <Image
          ref={imageRef}
          src={src}
          alt={alt}
          {...props}
          onLoad={({ target }) => {
            const image = target as HTMLImageElement
            setContainerDimensions({ width: image.naturalWidth, height: image.naturalHeight });
          }}
        />
      </div>
      {AnnotationsCanvas && isLoadedAnnotations && containerDimensions && (
        <AnnotationsContainer>
          <AnnotationsCanvas {...containerDimensions} />
        </AnnotationsContainer>
      )}
      {createToolbar()}
    </AnnotationsProvider>
  )
}

export default ViewerImage
