import axios from 'axios'
import { useState } from 'react'
import { Button, FileUpload, SaveButton } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { ayonApi } from '/src/services/ayon'
import { useDispatch } from 'react-redux'

const StyledFooter = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: flex-start;
  gap: 8px;

  div {
    display: flex;
    width: 100%;
    gap: 4px;

    & > * {
      flex: 1;
    }
  }
`

const StyledProgressBar = styled.hr`
  height: 4px;
  border-radius: 2px;
  background-color: var(--color-hl-00);

  width: ${({ $progress }) => $progress}%;
  border: none;
  margin: 4px 0;

  transition: width 0.3s;
`

const AddonUpload = ({ onClose }) => {
  const dispatch = useDispatch()
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const abortController = new AbortController()
  const cancelToken = axios.CancelToken
  const cancelTokenSource = cancelToken.source()

  const onUploadProgress = (progress, index, total) => {
    const percent = Math.round(
      ((index - 1) * 100 + (progress.loaded * 100) / progress.total) / total,
    )
    setProgress(percent)
  }

  const onInstall = async () => {
    let index = 0
    setIsUploading(true)
    try {
      for (const file of files) {
        const opts = {
          signal: abortController.signal,
          cancelToken: cancelTokenSource.token,
          onUploadProgress: (e) => onUploadProgress(e, index + 1, files.length),
        }

        await axios.post('/api/addons/install', file.file, opts)
        index++
      }
      setIsUploading(false)
      setIsComplete(true)
      setProgress(0)

      setFiles([])

      // update addon list
      dispatch(ayonApi.util.invalidateTags(['bundleList', 'addonList']))
    } catch (error) {
      console.log(error)
      setIsUploading(false)
      setIsComplete(true)
      setProgress(0)
      setErrorMessage('ERROR: ' + error?.response?.data?.traceback)
    }
  }

  //<Button onClick={onInstall} label="Install" disabled={!files?.length} />
  return (
    <FileUpload
      files={files}
      setFiles={setFiles}
      accept={['.zip']}
      allowMultiple
      placeholder="Drop .zip files here"
      isSuccess={isComplete}
      footer={
        <StyledFooter style={{ display: 'flex', width: '100%' }}>
          {isComplete && !isUploading && (errorMessage ? errorMessage : 'Upload complete!')}
          {isUploading && <StyledProgressBar $progress={progress} />}
          {!isComplete && !isUploading && 'Supports multiple .zip files.'}
          <div>
            {onClose && <Button onClick={onClose} label="Close" />}
            <SaveButton
              active={files.length}
              label="Install addons"
              onClick={onInstall}
              saving={isUploading}
            />
          </div>
        </StyledFooter>
      }
    />
  )
}

export default AddonUpload
