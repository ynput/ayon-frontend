import { getRangeId } from '@containers/TasksProgress/components/Drawover/hooks/useSaveAnnotation'
import { useAppSelector } from '@state/store'
import { useEffect, useState } from 'react'

type Props = {
  openCommentInput: () => void
}

const useAnnotationsSync = ({ openCommentInput }: Props) => {
  const [annotationFiles, setAnnotationFiles] = useState<File[]>([])
  // listen to the viewer for annotations
  const annotations = useAppSelector((state) => state.viewer.annotations)

  // when annotations change, update the state
  // convert the base64 image to a file
  useEffect(() => {
    const files: File[] = []
    for (const key in annotations) {
      const annotation = annotations[key]
      const range = annotation.range
      const img = annotation.img
      const blob = base64ToBlob(img)
      const file = new File([blob], `${getRangeId(range[0], range[1])}.png`, {
        type: 'image/png',
      })
      files.push(file)
    }

    // replace or add the annotations
    setAnnotationFiles((f) => {
      const newFiles = f.filter((file) => !files.some((f) => f.name === file.name))
      return [...newFiles, ...files]
    })

    // open the comment input if there are annotations
    if (files.length > 0) {
      openCommentInput()
    }
  }, [annotations, setAnnotationFiles])

  return { annotationFiles }
}

export default useAnnotationsSync

function base64ToBlob(base64: string) {
  const byteString = atob(base64.split(',')[1])
  const mimeString = base64.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeString })
}
