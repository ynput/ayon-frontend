import { uploadFile } from '../helpers'
import { toast } from 'react-toastify'
import { useFeedContext } from '../../../context/FeedContext'
import { SavedAnnotationMetadata } from '../../../index'

type Props = {
  projectName: string
  onSuccess: (data: any) => void
}

const useAnnotationsUpload = ({ projectName, onSuccess }: Props) => {
  const { removeAnnotation, exportAnnotationComposite } = useFeedContext()

  const uploadAnnotations = async (annotations: any[]) => {
    try {
      const uploadPromises = annotations.map(async (annotation) => {
        const composite = await exportAnnotationComposite?.(annotation.id)
        if (!composite) {
          throw new Error(`Exporting composite image for annotation ${annotation.id} failed`)
        }

        const compositeFile = new File([composite], annotation.name, {
          type: 'image/png',
        })

        const transparent = await fetch(annotation.annotationData).then(r => r.blob())
        const transparentFile = new File([transparent], `annotation-${annotation.name}`, {
          type: 'image/png',
        })

        const uploads = await Promise.all([
          uploadFile(compositeFile, projectName, () => {}),
          uploadFile(transparentFile, projectName, () => {}),
        ])

        return { annotation, uploads }
      })

      const res = await Promise.allSettled(uploadPromises)

      const successfulFiles: any[] = []
      const metadata: SavedAnnotationMetadata[] = []

      res.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { uploads, annotation } = result.value

          uploads.forEach((upload: any) => {
            successfulFiles.push(onSuccess(upload))
          })

          metadata.push({
            range: annotation.range,
            id: annotation.id,
            composite: uploads[0].data.id,
            transparent: uploads[1].data.id,
          })

          removeAnnotation?.(annotation.id)
        } else {
          toast.error('Upload failed: ' + result.reason.message)
        }
      })

      return { files: successfulFiles, metadata }
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message)
      return { files: [], metadata: [] }
    }
  }

  return uploadAnnotations
}

export default useAnnotationsUpload

const base64ToBlob = (base64: string) => {
  const byteString = atob(base64.split(',')[1])
  const mimeString = base64.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeString })
}
