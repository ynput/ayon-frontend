import { FC, useRef, useState } from 'react'
import { Image } from './Viewer.styled'
import { useViewer } from '@context/ViewerContext'
import styled, { CSSProperties } from 'styled-components'
import { AnnotationsContainerDimensions, ViewerOrientation } from './'

const AnnotationsContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`

interface ViewerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  reviewableId: string
  src: string
  alt: string
}

const ViewerImage: FC<ViewerImageProps> = ({ reviewableId, src, alt, ...props }) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const [containerDims, setContainerDims] = useState<AnnotationsContainerDimensions | null>(null)

  const {
    createToolbar,
    AnnotationsEditorProvider,
    AnnotationsCanvas,
    isLoaded: isLoadedAnnotations,
  } = useViewer()

  const orientation: ViewerOrientation = (containerDims?.width as number) > (containerDims?.height as number)
    ? "landscape"
    : "portrait";
  const aspectRatio = `${containerDims?.width} / ${containerDims?.height}`;

  const containerStyle: CSSProperties = {
    position: 'relative',
    aspectRatio,
    width: orientation === "landscape" ? "100%" : "auto",
    height: orientation === "landscape" ? "auto" : "100%",
  };

  return (
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
            setContainerDims({ width: image.naturalWidth, height: image.naturalHeight });
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
  )
}

export default ViewerImage
