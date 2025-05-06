import { useEffect, useState } from 'react'
import { getFileURL } from '../fileUtils'
import CodeEditor from '@uiw/react-textarea-code-editor'
import styled from 'styled-components'
// markdown
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import emoji from 'remark-emoji'

const CodeEditorPreview = styled(CodeEditor)`
  border-radius: var(--border-radius-m);
  height: 100%;
  overflow: auto !important;
`

interface TextMimeProps {
  file: {
    projectName: string
    id: string
    mime: string
    extension: string
  }
}

const TextMime = ({ file }: TextMimeProps) => {
  let fileURL = getFileURL(file.id, file.projectName)
  const [fileContent, setFileContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await fetch(fileURL)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const text = await response.text()
        setFileContent(text)
      } catch (err: any) {
        setError(err.message)
      }
    }

    fetchFile()
  }, [file.projectName, file.id, fileURL])

  if (error) {
    return <div>Error: {error}</div>
  }

  // if markdown file, return markdown
  if (file.mime?.includes('markdown'))
    return <Markdown remarkPlugins={[remarkGfm, emoji]}>{fileContent}</Markdown>

  return <CodeEditorPreview value={fileContent} language={file.extension} readOnly />
}

export default TextMime
