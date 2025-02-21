import { FC, useRef, useState } from 'react'
import { Image } from './Viewer.styled'
import { useViewer } from '@context/viewerContext'
import styled from 'styled-components'
import { AnnotationsContainerDimensions } from './'

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
    AnnotationsEditorProvider,
    AnnotationsCanvas,
    isLoaded: isLoadedAnnotations,
  } = useViewer()

  return (
    <AnnotationsEditorProvider
      backgroundRef={imageRef}
      containerDimensions={containerDimensions}
      pageNumber={1}
      id={reviewableId}
      src={src}
      mediaType="image"
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
    </AnnotationsEditorProvider>
  )
}

export default ViewerImage
