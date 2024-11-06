import { useEffect } from 'react'
import { Editor, TLPageId } from 'tldraw'
import { useAppSelector } from '@state/store'

type Props = {
  editor: Editor | null
  range: [number, number]
  durationFrames: number
}

// syncs the tldraw pages with the current frame
const useFramePageSync = ({ editor, range, durationFrames }: Props) => {
  const reviewableIds = useAppSelector((state) => state.viewer.reviewableIds)
  const reviewableId = reviewableIds[0]

  const [fFrame, lFrame] = range
  const annotationId = getAnnotationId(reviewableId, fFrame, lFrame) as TLPageId
  // when frame updates, set the page to the new frame
  useEffect(() => {
    if (editor) {
      if (fFrame > durationFrames || lFrame > durationFrames) return

      // get the page for the frame
      const page = editor.getPage(annotationId)
      if (!page) {
        //  create the new page
        editor.createPage({
          name: `${fFrame}-${lFrame}`,
          id: annotationId as TLPageId,
          meta: { type: 'frame', range },
        })
      }
      // set the current page to the frame
      editor.setCurrentPage(annotationId)
    }
  }, [range, editor, durationFrames])
}

export default useFramePageSync

export const getAnnotationId = (id: string, start: number, end: number): string =>
  `page:${id}-${start}-${end}`
