import { useAppDispatch, useAppSelector } from '@state/store'
import { onAnnotationRemoved } from '@state/viewer'
import { useEffect } from 'react'
import { Editor, TLPageId } from 'tldraw'

type Props = {
  editor: Editor | null
}

const useRemoveAnnotation = ({ editor }: Props) => {
  const dispatch = useAppDispatch()
  const annotationsToRemove = useAppSelector((state) => state.viewer.annotationsToRemove)

  // remove annotation (editor page) when annotationsToRemove changes
  // then once successfully removed, remove the annotation from the store
  useEffect(() => {
    if (!editor) return

    if (annotationsToRemove.length > 0) {
      const annotationId = annotationsToRemove[0]
      console.log(annotationId)

      const page = editor.getPage(annotationId as TLPageId)
      if (!page) return
      const shapeIds = editor.getPageShapeIds(page)
      if (!shapeIds) return
      // delete all shapes
      editor.deleteShapes(Array.from(shapeIds))

      dispatch(onAnnotationRemoved(annotationId))
    }
  }, [annotationsToRemove])
}

export default useRemoveAnnotation
