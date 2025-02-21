import { FC, useState, useRef } from 'react'
import axios from 'axios'
import { UploadServerConfigFileApiArg } from '@api/rest/config'
import { Button } from '@ynput/ayon-react-components'
import styled, { keyframes } from 'styled-components'
import { toast } from 'react-toastify'

interface ServerConfigUploadProps {
  fileType: UploadServerConfigFileApiArg['fileType']
  fileName: string
  setFileName: (value: string) => void
  onClear: () => Promise<void>
}

const spinCCW = keyframes`
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
`

const UploadContainer = styled.div`
  display: flex;
  gap: var(--base-gap-small);

  [icon='sync'] {
    animation: ${spinCCW} 1s linear infinite;
  }
`

const Filename = styled.div`
  background-color: var(--md-sys-color-surface-container-high);
  padding: 4px 8px;
  border-radius: var(--border-radius-m);
  flex: 1;

  display: flex;
  align-items: center;

  user-select: none;
  /* italics */
  font-style: italic;

  opacity: 0.7;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const HiddenInput = styled.input`
  display: none;
`

const ServerConfigUpload: FC<ServerConfigUploadProps> = ({ fileType, fileName, setFileName, onClear }) => {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setLoading(true)
      try {
        await axios.put(`/api/config/files/${fileType}`, selectedFile, {
          headers: {
            'x-file-name': selectedFile.name,
            'content-type': selectedFile.type,
          },
        })
        toast.success('File uploaded successfully')
        setFileName(selectedFile.name)
        // handle success (e.g., show a notification)
      } catch (error) {
        toast.error('Failed to upload file')
        // handle error (e.g., show an error message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <UploadContainer>
      <Filename>{fileName}</Filename>
      {fileName ? (
          <Button icon='cancel' onClick={onClear}>
            Remove
          </Button>
          ): (
          <Button icon={loading ? 'sync' : 'upload'} onClick={handleButtonClick}>
              Upload
          </Button>
          )}
      <HiddenInput ref={inputRef} type="file" onChange={handleFileChange} />
    </UploadContainer>
  )
}

export default ServerConfigUpload
