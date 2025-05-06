import { getFileURL } from '../fileUtils'
import * as Styled from '../FileUploadPreview.styled'

interface ImageMimeProps {
  file: {
    id: string
    projectName: string
    mime: string
  }
  fullPreviews?: string[]
}

const ImageMime = ({
  file,
  fullPreviews = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'],
}: ImageMimeProps) => {
  const { id, projectName, mime } = file
  let imgURL = getFileURL(id, projectName)
  const useFullPreview = fullPreviews.some((ext) => mime.includes(ext))
  if (!useFullPreview) imgURL += '/thumbnail'
  return <Styled.Image src={imgURL} autoFocus />
}

export default ImageMime
