import { useMemo, useCallback, useRef, DragEvent } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

export interface FormFileData {
  payload: string
  filename: string
  download?: boolean
}


const LinkButton = styled.button`
    width: auto;
    background: none;
    border: none;
    border-bottom: 1px dashed var(--md-sys-color-primary);
    color: var(--md-sys-color-primary);
    cursor: pointer;
    padding: 2px;
    font: inherit;
`

//
// File upload
//

const DropArea = styled.div`
  border: 2px dashed var(--md-sys-color-outline);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 200px;
  min-height: 100px;

  input {
    display: none;
  }
`


interface FormFileUploadProps {
  value?: FormFileData
  onChange: (value: FormFileData) => void
  validExtensions?: string[]
}

export const FormFileUpload = (props: FormFileUploadProps) => {
  // widget that displays a file upload input (and drop area)
  // and when user selects a file, it reads the file as base64 and calls setFieldValue with the base64 string
  
  const inputRef = useRef<HTMLInputElement>(null)

  const validExtensions = useMemo(() => props.validExtensions?.map(ext => ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`), [props.validExtensions])

  const handleFileChange = useCallback((file?: File) => {

    if (!file) {
      return
    }

    if (file.size === 0) {
      toast.error('Cannot upload empty file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2 MB limit, because we're sending it in JSON as base64
      toast.error('File size exceeds the 2 MB limit.')
      return
    }

    if (validExtensions) {
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`
      if (!validExtensions.includes(fileExtension)) {
        toast.error(`Invalid file type. Supported formats: ${validExtensions.join(', ')}`)
        return
      }
    }

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
  }, [props, validExtensions])


  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const files = [...e.dataTransfer.files];
    if (files.length === 1) {
      handleFileChange(files[0]);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFileChange(file);
  }


  return (
    <DropArea
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={inputRef}
        onChange={handleInputChange} 
        accept={validExtensions?.join(',')} 
        multiple={false}
        style={{ display: 'none' }}
      />

      <LinkButton type="button" onClick={() => inputRef.current?.click()}>
        {props.value ? `Change file (${props.value.filename})` : 'Upload file'}
      </LinkButton>

    </DropArea>
  )

}

//
// File download
//

const DownloadLink = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  background: none;
  border: none;
`

interface FormFileDownloadProps {
  value: FormFileData
}

export const FormFileDownload = (props: FormFileDownloadProps) => {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `data:application/octet-stream;base64,${props.value.payload}`
    link.download = props.value.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DownloadLink>
      <LinkButton onClick={handleDownload}>
        {props.value.filename}
      </LinkButton>
    </DownloadLink>
  )
}
