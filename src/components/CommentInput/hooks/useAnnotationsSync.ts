import { useAppDispatch, useAppSelector } from '@state/store'
import { Annotation, removeAnnotation } from '@state/viewer'
import { useEffect } from 'react'

type Props = {
  openCommentInput: () => void
  entityId: string
}

type AnnotationPreview = Annotation & {
  isAnnotation: true
}

// annotations are temporary store
const useAnnotationsSync = ({ openCommentInput, entityId }: Props) => {
  const dispatch = useAppDispatch()
  // listen to the viewer for annotations
  const allAnnotations = useAppSelector((state) => state.viewer.annotations)
  // filter out annotations that are for this entity
  const annotations = Object.values(allAnnotations)
    .filter((annotation) => annotation.versionId === entityId)
    .map((annotation) => ({ ...annotation, isAnnotation: true })) as AnnotationPreview[]

  // when annotations change, update the state
  // convert the base64 image to a file
  useEffect(() => {
    // const files: File[] = []
    // for (const key in annotations) {
    //   const annotation = annotations[key]
    //   const range = annotation.range
    //   const img = annotation.img
    //   const blob = base64ToBlob(img)
    //   const file = new File([blob], `${getRangeId(range[0], range[1])}.png`, {
    //     type: 'image/png',
    //   })
    //   files.push(file)
    // }

    // open the comment input if there are annotations
    if (annotations.length > 0) {
      openCommentInput()
    }
  }, [annotations])

  const handleRemoveAnnotation = (id: string) => {
    dispatch(removeAnnotation(id))
  }

  return { annotations, removeAnnotation: handleRemoveAnnotation }
}

export default useAnnotationsSync

// function base64ToBlob(base64: string) {
//   const byteString = atob(base64.split(',')[1])
//   const mimeString = base64.split(',')[0].split(':')[1].split(';')[0]
//   const ab = new ArrayBuffer(byteString.length)
//   const ia = new Uint8Array(ab)
//   for (let i = 0; i < byteString.length; i++) {
//     ia[i] = byteString.charCodeAt(i)
//   }
//   return new Blob([ab], { type: mimeString })
// }
