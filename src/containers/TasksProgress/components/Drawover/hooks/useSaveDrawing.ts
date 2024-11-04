import { useAppDispatch } from '@state/store'
import { addDrawing } from '@state/viewer'
import { debounce } from 'lodash'
import { useEffect } from 'react'
import { Editor, SerializedStore, TLEditorSnapshot, TLRecord } from 'tldraw'

type Props = {
  editor: Editor | null
  videoRef: HTMLVideoElement | null
  range: [number, number]
}

const useSaveDrawing = ({ editor, videoRef, range }: Props) => {
  const dispatch = useAppDispatch()

  const saveDrawing = async () => {
    console.log('SAVING DRAWING: start', range)
    if (!editor) return
    const currentPage = editor.getCurrentPage()
    if (!currentPage) return
    const shapeIds = editor.getPageShapeIds(currentPage)
    if (!shapeIds) return

    const drawing = await editor.getSvgString(Array.from(shapeIds), {
      bounds: editor.getViewportPageBounds(),
      padding: 0,
    })

    const svg = drawing?.svg

    if (!svg || !videoRef) return

    // Create a canvas matching the video dimensions
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.videoWidth
    canvas.height = videoRef.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw the current video frame onto the canvas
    ctx.drawImage(videoRef, 0, 0, canvas.width, canvas.height)

    // Create an image for the SVG overlay
    const svgImage = new Image()
    svgImage.onload = async () => {
      // Draw the SVG over the video frame
      ctx.drawImage(svgImage, 0, 0, canvas.width, canvas.height)

      // Get the combined image as a data URL
      const dataUrl = canvas.toDataURL('image/png')

      const snapshot = editor.getSnapshot()
      const pageSnapshot = getPageStore(snapshot, currentPage.id)

      // Dispatch the combined image and current frame time
      dispatch(
        addDrawing({
          id: getRangeId(range[0], range[1]),
          snapshot: pageSnapshot,
          svg: svg,
          img: dataUrl,
          range: range,
          width: canvas.width,
          height: canvas.height,
        }),
      )
    }
    svgImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  }

  const debouncedSave = debounce(saveDrawing, 300)

  useEffect(() => {
    const cleanupFunction = editor?.store.listen(debouncedSave, {
      source: 'user',
      scope: 'document',
    })

    return () => {
      cleanupFunction?.()
    }
  }, [editor, range, videoRef])

  return saveDrawing
}

export default useSaveDrawing

export const getRangeId = (start: number, end: number): string => `${start}-${end}`

export type PageSnapshot = {
  store: SerializedStore<TLRecord>
  schema: TLEditorSnapshot['document']['schema']
}
// only get page and its shapes
const getPageStore = (snapshot: TLEditorSnapshot, pageId: string): PageSnapshot => {
  const store = snapshot.document.store as Record<string, any>
  const page = store[pageId]
  const shapes = Object.entries(store).filter(([, shape]) => shape.parentId === pageId)

  const pageStore = {
    [pageId]: page,
    ...Object.fromEntries(shapes),
  }

  return {
    store: pageStore,
    schema: snapshot.document.schema,
  }
}
