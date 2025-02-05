import { UploadServerConfigFileApiArg } from '@api/rest/config'
import axios from 'axios'
import { FC, useState } from 'react'

interface ServerConfigUploadProps {
  fileType: UploadServerConfigFileApiArg['fileType']
}

const ServerConfigUpload: FC<ServerConfigUploadProps> = ({ fileType }) => {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    try {
      await axios.put(`/api/config/files/${fileType}`, file, {
        headers: {
          'x-file-name': file.name,
          'content-type': file.type,
        },
      })
      // handle success (e.g., show a notification)
    } catch (error) {
      // handle error (e.g., show an error message)
    }
  }

  return (
    <div>
      ServerConfigUpload
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  )
}

export default ServerConfigUpload
