import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { Icon } from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'
import api from '@shared/api'
import { Thumbnail } from '@shared/components'
import * as Styled from './ProjectThumbnailUploader.styled'

export interface ProjectThumbnailUploaderProps {
  projectName: string
  projectUpdatedAt?: string
  isFetching?: boolean
  disabled?: boolean
  children?: ReactNode
}

export const ProjectThumbnailUploader = ({
  projectName,
  projectUpdatedAt,
  isFetching,
  disabled = false,
  children,
}: ProjectThumbnailUploaderProps) => {
  const dispatch = useDispatch()

  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [isDropZoneActive, setIsDropZoneActive] = useState(false)
  const dragCounterRef = useRef(0)

  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const [localUpdatedAt, setLocalUpdatedAt] = useState<string | undefined>(undefined)
  const effectiveUpdatedAt =
    localUpdatedAt && (!projectUpdatedAt || localUpdatedAt > projectUpdatedAt)
      ? localUpdatedAt
      : projectUpdatedAt

  useEffect(() => {
    setLocalUpdatedAt(undefined)
  }, [projectName])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const resetState = () => {
    setIsDraggingFile(false)
    setIsDropZoneActive(false)
    setIsUploading(false)
    setProgress(0)
    dragCounterRef.current = 0
  }

  const handleCancel = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    resetState()
  }

  const handleUploadThumbnail = async (file: File) => {
    if (!file) return resetState()

    if (!file.type.includes('image')) {
      toast.error('File is not an image')
      return resetState()
    }

    if (!projectName) {
      toast.error('Project name is required')
      return resetState()
    }

    setIsUploading(true)
    setProgress(0)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      await axios.post(`/api/projects/${projectName}/thumbnail`, file, {
        headers: { 'Content-Type': file.type },
        signal: controller.signal,
        onUploadProgress: (e) => {
          setProgress(Math.round((100 * e.loaded) / (e.total || file.size)))
        },
      })

      setLocalUpdatedAt(new Date().toISOString())
      dispatch(api.util.invalidateTags([{ type: 'project', id: projectName }]))
      resetState()
    } catch (error: any) {
      if (axios.isCancel(error) || controller.signal.aborted) {
        return
      }
      console.error(error)
      toast.error(
        error?.response?.data?.detail || error?.message || 'Failed to upload thumbnail',
      )
      resetState()
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    dragCounterRef.current++
    if (dragCounterRef.current === 1) setIsDraggingFile(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDraggingFile(false)
      setIsDropZoneActive(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDraggingFile(false)
    setIsDropZoneActive(false)

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return

    handleUploadThumbnail(e.dataTransfer.files[0])
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    handleUploadThumbnail(files[0])
    e.target.value = ''
  }

  const openFilePicker = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  return (
    <Styled.Wrapper
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Styled.ThumbnailSlot
        onClick={disabled ? undefined : openFilePicker}
        style={disabled ? { cursor: 'default' } : undefined}
      >
        <Thumbnail
          entityType="project"
          projectName={projectName}
          entityUpdatedAt={effectiveUpdatedAt}
          icon="add_photo_alternate"
          shimmer={isFetching}
          style={{ height: 'auto', aspectRatio: 1.7 }}
        />
      </Styled.ThumbnailSlot>

      {children}

      {isDraggingFile && (
        <Styled.Overlay>
          <Styled.DropZone
            className={clsx({ active: isDropZoneActive })}
            onDragOver={() => setIsDropZoneActive(true)}
            onDragLeave={() => setIsDropZoneActive(false)}
          >
            <Icon icon="add_photo_alternate" />
            <span>Upload thumbnail</span>
          </Styled.DropZone>
        </Styled.Overlay>
      )}

      {isUploading && (
        <Styled.Overlay>
          <Styled.UploadingProgress>
            <Styled.Progress style={{ right: `${100 - progress}%` }} />
            <span className="label">Uploading thumbnail...</span>
          </Styled.UploadingProgress>
          <Styled.CancelButton icon="close" variant="text" onClick={handleCancel} />
        </Styled.Overlay>
      )}

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleInputChange} />
    </Styled.Wrapper>
  )
}

export default ProjectThumbnailUploader