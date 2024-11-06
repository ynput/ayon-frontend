import { useAppDispatch } from '@state/store'
import { addAnnotation } from '@state/viewer'
import { debounce } from 'lodash'
import { useEffect } from 'react'
import { Editor, SerializedStore, TLEditorSnapshot, TLRecord } from 'tldraw'

type Props = {
  editor: Editor | null
  videoRef: HTMLVideoElement | null
  range: [number, number]
  name: string
}

const useSaveAnnotation = ({ editor, videoRef, range, name }: Props) => {
  const dispatch = useAppDispatch()

  const saveAnnotation = async () => {
    if (!editor) return
    const currentPage = editor.getCurrentPage()
    if (!currentPage) return
    const shapeIds = editor.getPageShapeIds(currentPage)
    if (!shapeIds) return

    const annotation = await editor.getSvgString(Array.from(shapeIds), {
      bounds: editor.getViewportPageBounds(),
      padding: 0,
    })

    const svg = annotation?.svg

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

      //   svg image to dataUrl
      const overlay = svgImage.src

      // Get the combined image as a data URL
      const dataUrl = canvas.toDataURL('image/png')

      // Dispatch the combined image and current frame time
      dispatch(
        addAnnotation({
          id: currentPage.id,
          name: `${name}-${range[0]}-${range[1]}.png`,
          range: range,
          width: canvas.width,
          height: canvas.height,
          overlay: overlay,
          img: dataUrl,
        }),
      )
    }
    svgImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  }

  const debouncedSave = debounce(saveAnnotation, 300)

  useEffect(() => {
    const cleanupFunction = editor?.store.listen(debouncedSave, {
      source: 'user',
      scope: 'document',
    })

    return () => {
      cleanupFunction?.()
    }
  }, [editor, range, videoRef])

  return saveAnnotation
}

export default useSaveAnnotation

export type PageSnapshot = {
  store: SerializedStore<TLRecord>
  schema: TLEditorSnapshot['document']['schema']
}
