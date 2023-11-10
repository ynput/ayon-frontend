import React, { useEffect, useState } from 'react'
import * as Styled from './ThumbnailUploader.styled'
import { Icon } from '@ynput/ayon-react-components'
import axios from 'axios'
import { ayonApi } from '/src/services/ayon'
import { useDispatch } from 'react-redux'

const ThumbnailUploader = ({ entityType, entityId, projectName, existingImage }) => {
  const dispatch = useDispatch()
  const [dragHover, setDragHover] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  //   progress 0-1
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleFileUpload = async (files) => {
    // we select this to trigger preview image
    setSelectedFiles(files)

    const abortController = new AbortController()
    const cancelToken = axios.CancelToken
    const cancelTokenSource = cancelToken.source()

    const file = files[0]

    const opts = {
      signal: abortController.signal,
      cancelToken: cancelTokenSource.token,
      onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total) / 100),
      headers: {
        'Content-Type': file.type,
      },
    }

    try {
      // for a single file we just use single entityId
      await axios.post(
        `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`,
        files[0],
        opts,
      )

      setUploadSuccess(true)

      console.log({ type: entityType, id: entityId })

      // if success then we need to refresh the thumbnail
      // which means invalidating the entityCache
      dispatch(ayonApi.util.invalidateTags([{ type: entityType, id: entityId }]))
    } catch (error) {
      console.error(error)
      setUploadError(error.response?.data.detail)
    }

    // once upload, we can use new thumbnail Id and update the entity
    // if(res.data && res.data.id) {}
  }

  //   when selectedFiles changes, show preview image
  useEffect(() => {
    if (!selectedFiles || !selectedFiles[0]) return

    const objectUrl = URL.createObjectURL(selectedFiles[0])
    setImagePreview(objectUrl)

    // free memory when ever this component is unmounted
    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedFiles])

  // after 1s seconds of upload success, reset the state
  useEffect(() => {
    if (!uploadSuccess) return

    const timer = setTimeout(() => {
      setUploadSuccess(false)
      setSelectedFiles([])
      setImagePreview(null)
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

  const totalFileSize = Array.from(selectedFiles).reduce(
    (acc, file) => acc + file.size / 1024 / 1024,
    0,
  )

  return (
    <>
      <Styled.ThumbnailUploaderWrapper
        $dragHover={dragHover}
        $uploading={!!selectedFiles.length}
        $existingImage={existingImage}
        $success={uploadSuccess}
      >
        <div className="bg" />
        <Icon icon="cloud_upload" className="upload" />
        <Styled.ThumbnailInput
          type="file"
          onDragEnter={() => setDragHover(true)}
          onDragLeave={() => setDragHover(false)}
          onDrop={handleInputDrop}
          onChange={handleInputChange}
          accept="image/*"
        />

        {!!selectedFiles.length && imagePreview && (
          <Styled.ThumbnailUploading $success={uploadSuccess}>
            <Styled.UploadPreview
              src={imagePreview}
              className="preview"
              $progress={uploadProgress}
            />
            {uploadError ? (
              <Styled.UploadError>{uploadError}</Styled.UploadError>
            ) : (
              totalFileSize > 1 && (
                <Styled.UploadProgress $progress={uploadProgress} className="progress" />
              )
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
    </>
  )
}

export default ThumbnailUploader
