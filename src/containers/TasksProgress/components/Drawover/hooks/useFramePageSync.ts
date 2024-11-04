import { useEffect } from 'react'
import { Editor, TLPageId } from 'tldraw'
import { getRangeId } from './useSaveDrawing'

type Props = {
  editor: Editor | null
  range: [number, number]
  durationFrames: number
}

// syncs the tldraw pages with the current frame
const useFramePageSync = ({ editor, range, durationFrames }: Props) => {
  const [fFrame, lFrame] = range
  const rangeString = getRangeId(fFrame, lFrame)
  const rangePageId = `page:${rangeString}` as TLPageId
  // when frame updates, set the page to the new frame
  useEffect(() => {
    if (editor) {
      if (fFrame > durationFrames || lFrame > durationFrames) return

      // get the page for the frame
      const page = editor.getPage(rangePageId)
      if (!page) {
        //  create the new page
        editor.createPage({
          name: rangeString,
          id: rangePageId as TLPageId,
          meta: { type: 'frame', range },
        })
      }
      // set the current page to the frame
      editor.setCurrentPage(rangePageId as TLPageId)
    }
  }, [range, editor, durationFrames])
}

export default useFramePageSync
