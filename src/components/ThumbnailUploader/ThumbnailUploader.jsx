import React, { useEffect, useState } from 'react'
import * as Styled from './ThumbnailUploader.styled'
import { Icon } from '@ynput/ayon-react-components'
import axios from 'axios'

const ThumbnailUploader = ({
  entityType,
  entityId,
  projectName,
  existingImage,
  onUpload,
  onUploading,
  isPortal,
  entities,
  isButton,
}) => {
  const [dragHover, setDragHover] = useState(false)
  const [imagePreviews, setImagePreviews] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  //   progress 0-1
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleFileUpload = async (files) => {
    // we select this to trigger preview image
    onUploading && onUploading()

    let entitiesWithFiles = [{ entityId, file: files[0] }]
    // check for multiple and multiple entities, if both try to map file name to entity name.
    if (entities?.length && files?.length > 1) {
      // get all entities that have a file with matching name
      // Create a map of files by name
      const fileMap = new Map(
        Array.from(files).map((file) => [file.name.split('.')[0].toLowerCase(), file]),
      )

      // Map over entities and get the corresponding file from the map
      const matchingFiles = entities
        .map((entity) => {
          const entityName = entity?.name?.toLowerCase()
          const file = fileMap.get(entityName)
          return file ? { entityId: entity?.id, file } : null
        })
        .filter(Boolean) // Remove null values

      if (matchingFiles.length) entitiesWithFiles = matchingFiles
    }

    // object with entityId as key and file as value
    setSelectedFiles(entitiesWithFiles.map((e) => e.file))

    const abortController = new AbortController()
    const cancelToken = axios.CancelToken
    const cancelTokenSource = cancelToken.source()

    try {
      for (const entityFile of entitiesWithFiles) {
        const index = entitiesWithFiles.indexOf(entityFile)
        const { entityId, file } = entityFile || {}
        const opts = {
          signal: abortController.signal,
          cancelToken: cancelTokenSource.token,
          onUploadProgress: (e) => {
            setUploadProgress(
              () =>
                Math.round(
                  ((e.loaded * 100) / e.total) * ((index + 1) / entitiesWithFiles.length),
                ) / 100,
            )
          },
          headers: {
            'Content-Type': file.type,
          },
        }

        // for a single file we just use single entityId
        const res = await axios.post(
          projectName && `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`,
          file,
          opts,
        )

        onUpload && onUpload({ type: entityType, id: entityId, thumbnailId: res.data?.id })
      }

      setUploadSuccess(true)
    } catch (error) {
      console.error(error)
      setUploadError(error.response?.data.detail)
    }
  }

  //   when selectedFiles changes, show preview image
  useEffect(() => {
    if (!selectedFiles.length) return

    const objectUrls = Array.from(selectedFiles)
      .slice(0, 3)
      .map((file) => URL.createObjectURL(file))
    setImagePreviews(objectUrls)

    // free memory when ever this component is unmounted
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [selectedFiles])

  // after 1s seconds of upload success, reset the state
  useEffect(() => {
    if (!uploadSuccess) return

    const timer = setTimeout(() => {
      setUploadSuccess(false)
      setSelectedFiles([])
      setImagePreviews([])
    }, 2000)

    return () => {
      clearTimeout(timer)
    }
  }, [uploadSuccess])

  const handleInputChange = (e) => {
    e.preventDefault()
    if (!e.target.files || !e.target.files[0]) return

    handleFileUpload(e.target.files)
  }

  const handleInputDrop = (e) => {
    e.preventDefault()
    setDragHover(false)
    if (!e.dataTransfer.files || !e.dataTransfer.files[0]) return

    handleFileUpload(e.dataTransfer.files)
  }

  return (
    <Styled.ThumbnailUploaderWrapper
      $dragHover={dragHover}
      $uploading={!!selectedFiles.length}
      $existingImage={existingImage}
      $success={uploadSuccess}
      $isPortal={isPortal}
      $isButton={isButton}
    >
      {isButton ? (
        <Styled.UploadButton
          icon="edit"
          className="upload-button"
          iconProps={{ className: 'edit' }}
          data-tooltip={'Upload thumbnail from file'}
          tooltip=""
        >
          <Styled.ButtonInput type="file" onChange={handleInputChange} accept=".png, .jpeg, .jpg" />
        </Styled.UploadButton>
      ) : (
        <>
          <div className="bg" />
          <Icon icon="cloud_upload" className="upload" />
          <Styled.ThumbnailInput
            type="file"
            onDragEnter={() => setDragHover(true)}
            onDragLeave={() => setDragHover(false)}
            onDrop={handleInputDrop}
            onChange={handleInputChange}
            accept=".png, .jpeg, .jpg"
          />
        </>
      )}

      {!!selectedFiles.length && imagePreviews.length && (
        <Styled.ThumbnailUploading $success={uploadSuccess} $isPortal={isPortal}>
          {imagePreviews.map((preview, i) => (
            <Styled.UploadPreview
              src={preview}
              key={i}
              className="preview"
              style={{
                rotate: `${i * 10}deg`,
              }}
            />
          ))}
          {uploadError ? (
            <Styled.UploadError>{uploadError}</Styled.UploadError>
          ) : (
            <Styled.UploadProgress $progress={uploadProgress} className="progress" />
          )}
        </Styled.ThumbnailUploading>
      )}
      {uploadError && (
        <Styled.Close
          icon="close"
          variant="text"
          onClick={() => {
            setUploadError('')
            setSelectedFiles([])
          }}
        />
      )}
    </Styled.ThumbnailUploaderWrapper>
  )
}

export default ThumbnailUploader
