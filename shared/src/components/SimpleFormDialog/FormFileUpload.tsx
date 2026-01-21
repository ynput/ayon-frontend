export interface FormFileData {
  payload: string
  filename: string
}

interface FormFileUploadProps {
  value?: SimpleFormFileData
  onChange: (value: SimpleFormFileData) => void
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
