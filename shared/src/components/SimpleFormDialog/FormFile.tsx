export interface FormFileData {
  payload: string
  filename: string
  download?: boolean
}

interface FormFileUploadProps {
  value?: FormFileData
  onChange: (value: FormFileData) => void
}

export const FormFileUpload = (props: FormFileUploadProps) => {
  // widget that displays a file upload input (and drop area)
  // and when user selects a file, it reads the file as base64 and calls setFieldValue with the base64 string

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1] // remove data:*/*;base64, prefix
        props.onChange(
          { payload: base64String, filename: file.name }
        )
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="form-file-upload">
      <input type="file" onChange={handleFileChange} />
    </div>
  )

}



interface FormFileDownloadProps {
  value: FormFileData
}

export const FormFileDownload = (props: FormFileDownloadProps) => {
  // widget that displays a download link for the file represented by the base64 string in props.value

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `data:application/octet-stream;base64,${props.value.payload}`
    link.download = props.value.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="form-file-download">
      <button onClick={handleDownload}>Download {props.value.filename}</button>
    </div>
  )
}
