import { ChangeEvent, DragEvent, HTMLAttributes, LegacyRef, useState } from 'react'
import * as Styled from './ThumbnailUploader.styled'
import { Icon } from '@ynput/ayon-react-components'
import axios from 'axios'
import clsx from 'clsx'
import { toast } from 'react-toastify'

type Entity = {
  id: string
  entityType: string
  projectName: string
}

interface ThumbnailUploaderProps extends HTMLAttributes<HTMLDivElement> {
  onFinish: (entities: { id: string; thumbnailId: string }[]) => void
  inputRef: LegacyRef<HTMLInputElement>
  onUploadInProgress: Function
  entities: Entity[]
}

const ThumbnailUploader = ({ onFinish, entities, onUploadInProgress, inputRef, ...props }: ThumbnailUploaderProps) => {
  const [uploadingFile, setUploadingFile] = useState<null | File>()
  const [uploadingPreview, setUploadingPreview] = useState<null | string>()
  const [progress, setProgress] = useState(0)

  const resetState = () => {
    setUploadingFile(null)
    setProgress(0)
    setUploadingPreview(null)
  }

  const handleDroppedFileUpload = async (file: File) => {
    if (!file) return onFinish([])

    try {
      // check file is an image
      if (!file.type.includes('image')) {
        throw new Error('File is not an image')
      }

      setUploadingFile(file)
      setUploadingPreview(URL.createObjectURL(file))

      let promises = []
      for (const entity of entities) {
        const { id, entityType, projectName } = entity

        console.log(projectName)

        if (!projectName) throw new Error('Project name is required')

        const promise = axios.post(
          projectName && `/api/projects/${projectName}/${entityType}s/${id}/thumbnail`,
          file,
          {
            onUploadProgress: (e) => {
              setProgress(Math.round((100 * e.loaded) / (e.total || file.size)))
            },
            headers: {
              'Content-Type': file.type,
            },
          },
        )

        promises.push(promise)
      }

      const res = await Promise.all(promises)

      const updatedEntities = res.map((res, i) => ({
        thumbnailId: res.data.id as string,
        id: entities[i].id,
      }))

      onFinish(updatedEntities)
      resetState()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message)
      onFinish([])
      resetState()
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    onUploadInProgress()
    const files = event.target.files
    if (!files) {
      return
    }

    const file = files[0]
    if (file) {
      handleDroppedFileUpload(file)
    }
  }

  const handleInputDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()

    const file = e.dataTransfer.files[0]
    handleDroppedFileUpload(file)
  }

  return (
    <>
      <Styled.ThumbnailUploaderWrapper
        className={clsx({ uploading: uploadingFile })}
        onDrop={handleInputDrop}
        {...props}
      >
        <div className="bg" />

        {uploadingFile && uploadingPreview ? (
          <Styled.Uploading>
            <img src={uploadingPreview} alt="uploading preview" />
            <div className="progress-wrapper">
              <Styled.Progress
                style={{
                  right: `${100 - progress}%`,
                }}
              />
            </div>
          </Styled.Uploading>
        ) : (
          <Styled.Message>
            <Icon icon="add_photo_alternate" className="upload" />
            <span>Upload thumbnail</span>
          </Styled.Message>
        )}
      </Styled.ThumbnailUploaderWrapper>
      <input type="file" onChange={handleFileUpload} ref={inputRef} />
    </>
  )
}

export default ThumbnailUploader
