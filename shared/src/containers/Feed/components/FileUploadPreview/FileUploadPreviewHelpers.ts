import { getFileURL } from './fileUtils'
import ImageMime from './Mimes/ImageMime'
import TextMime from './Mimes/TextMime'
import VideoMime from './Mimes/VideoMime'
import type { MimeTypeDefinition } from './FileUploadPreview'

// define expandable mime types and their components
export const expandableMimeTypes: { [key: string]: MimeTypeDefinition } = {
  image: {
    component: ImageMime,
    mimeTypes: ['image/'],
    fullPreviews: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'],
    id: 'image',
  },
  video: {
    component: VideoMime,
    mimeTypes: ['video/'],
    id: 'video',
  },
  text: {
    component: TextMime,
    mimeTypes: ['text/', 'application/json', 'scss', 'jsx'],
    id: 'text',
  },
  pdf: {
    component: null,
    mimeTypes: ['pdf'],
    id: 'pdf',
    callback: (file: any) => window.open(getFileURL(file.id, file.projectName), '_blank'),
  },
}

export const isFilePreviewable = (mime = '', ext = '') =>
  Object.values(expandableMimeTypes).some(({ mimeTypes = [] }) =>
    mimeTypes.some((type) => (mime || ext)?.includes(type)),
  )
