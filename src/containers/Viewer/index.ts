import Viewer from './Viewer'
import ViewerDialog from './ViewerDialog'

export default Viewer
export { ViewerDialog }

export type AnnotationMediaType = "image" | "video"

export type AnnotationMetadata = {
  id: string;
  page: number;
  name: string;
  range: number[];
  width?: number;
  height?: number;
  thumbnail: string | null; // Blob URL
  annotationData?: string | null; // Blob URL
  versionId?: string;
  src: string;
  mediaType: AnnotationMediaType;
  atMediaTime: number;
}

export type AnnotationsContainerDimensions = {
  width?: number;
  height?: number;
}

export type AnnotationsEditorProviderProps = {
  children: React.ReactNode
  id?: string
  src: string
  mediaType: AnnotationMediaType
  backgroundRef?: React.MutableRefObject<
    HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | null
  >
  containerDimensions: AnnotationsContainerDimensions | null
  pageNumber: number
  atMediaTime?: number
}

export type AnnotationsId = string
export type AddonAnnotationsRecord = Record<AnnotationsId, AnnotationMetadata>
export type AnnotationsRecord = Record<AnnotationsId, AnnotationMetadata>

export type AnnotationsContextType = {
  annotations: AddonAnnotationsRecord;
  removeAnnotation: (id: AnnotationsId) => void;
  exportAnnotationComposite: (id: AnnotationsId) => Promise<Blob | null>;
}

export type AnnotationsProviderProps = {
  versionId: string,
  children: React.ReactNode;
}

export type ViewerOrientation = "landscape" | "portrait";
