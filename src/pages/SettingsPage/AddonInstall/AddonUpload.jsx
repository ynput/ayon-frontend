import axios from 'axios'
import { useState } from 'react'
import { Panel, FileUpload } from '@ynput/ayon-react-components'

const AddonUpload = () => {
  const [files, setFiles] = useState([])
  const [currentIndex, setCurrentIndex] = useState(null)

  const abortController = new AbortController()
  const cancelToken = axios.CancelToken
  const cancelTokenSource = cancelToken.source()

  const onUploadProgress = (progress) => {
    console.log(progress)
  }

  const onInstall = async () => {
    let index = 0
    for (const file of files) {
      setCurrentIndex(index)

      const opts = {
        signal: abortController.signal,
        cancelToken: cancelTokenSource.token,
        onUploadProgress: onUploadProgress,
      }

      await axios.post('/api/addons/install', file.file, opts)
      index++
    }

    setFiles([])
    setCurrentIndex(null)
  }

  //<Button onClick={onInstall} label="Install" disabled={!files?.length} />
  return (
    <Panel style={{ maxWidth: 400, alignItems: 'center' }}>
      <FileUpload
        files={files}
        setFiles={setFiles}
        validExtensions={['zip']}
        allowMultiple
        confirmLabel="Install"
        onSubmit={onInstall}
      />
      {currentIndex !== null && (
        <div>
          Installing {currentIndex + 1} of {files.length}
        </div>
      )}
    </Panel>
  )
}

export default AddonUpload
