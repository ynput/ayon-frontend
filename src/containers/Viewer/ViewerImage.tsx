import { FC, useRef } from 'react'
import { Image } from './Viewer.styled'
import { useViewer } from '@context/viewerContext'
import styled from 'styled-components'

const AnnotationsContainer = styled.div`
  position: absolute;
`

interface ViewerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  reviewableId: string
  src: string
  alt: string
}

const ViewerImage: FC<ViewerImageProps> = ({ reviewableId, src, alt, ...props }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

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
      containerRef={containerRef}
      pageNumber={1}
      onAnnotationsChange={addAnnotation}
      annotations={annotations}
      id={reviewableId}
    >
      <div ref={containerRef} style={{ position: 'relative' }}>
        <Image src={src} alt={alt} {...props} ref={imageRef} />
      </div>
      {AnnotationsCanvas && isLoadedAnnotations && (
        <AnnotationsContainer>
          <AnnotationsCanvas width={imageRef.current?.width} height={imageRef.current?.height} />
        </AnnotationsContainer>
      )}
      {createToolbar()}
    </AnnotationsProvider>
  )
}

export default ViewerImage
