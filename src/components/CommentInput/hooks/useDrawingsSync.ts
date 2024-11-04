import { getRangeId } from '@containers/TasksProgress/components/Drawover/hooks/useSaveDrawing'
import { useAppSelector } from '@state/store'
import { useEffect, useState } from 'react'

type file = {
  id: string
  name: string
  mime: string
  size: number
  order: number
}

type Props = {
  openCommentInput: () => void
}

const useDrawingsSync = ({ openCommentInput }: Props) => {
  const [drawingFiles, setDrawingFiles] = useState<File[]>([])
  // listen to the viewer for drawings
  const drawings = useAppSelector((state) => state.viewer.drawings)

  // when drawings change, update the state
  // convert the base64 image to a file
  useEffect(() => {
    const files: File[] = []
    for (const key in drawings) {
      const drawing = drawings[key]
      const range = drawing.range
      const img = drawing.img
      const blob = base64ToBlob(img)
      const file = new File([blob], `${getRangeId(range[0], range[1])}.png`, {
        type: 'image/png',
      })
      files.push(file)
    }

    // replace or add the drawings
    setDrawingFiles((f) => {
      const newFiles = f.filter((file) => !files.some((f) => f.name === file.name))
      return [...newFiles, ...files]
    })

    // open the comment input if there are drawings
    if (files.length > 0) {
      openCommentInput()
    }
  }, [drawings, setDrawingFiles])

  return [drawingFiles, setDrawingFiles]
}

export default useDrawingsSync

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
