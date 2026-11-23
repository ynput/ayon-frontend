import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

interface UseSaveFrameArgs {
  src: string
  frameRate: number
  fileName?: string
}

const getFrameFileName = (fileName: string | undefined, frame: number) => {
  const baseName = fileName?.replace(/\.[^.]+$/, '') || 'frame'
  return `${baseName}_${String(frame + 1).padStart(4, '0')}.jpg`
}

const useSaveFrame = ({ src, frameRate, fileName }: UseSaveFrameArgs) => {
  const [isSaving, setIsSaving] = useState(false)

  const saveFrame = async (frame: number) => {
    if (isSaving) return
    setIsSaving(true)
    // The server returns the first frame at or after t, so aim half a frame early.
    const t = Math.max(0, (frame - 0.5) / frameRate)
    try {
      const response = await axios.get<Blob>(`${src}/still`, {
        params: { t },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = getFrameFileName(fileName, frame)
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      toast.error('Failed to save frame')
    } finally {
      setIsSaving(false)
    }
  }

  return { saveFrame, isSaving }
}

export default useSaveFrame
