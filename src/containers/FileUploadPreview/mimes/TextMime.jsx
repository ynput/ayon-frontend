import { useEffect, useState } from 'react'
import { getFileURL } from '../FileUploadPreview'
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

const TextMime = ({ file: { projectName, id, mime, extension } = {} }) => {
  let fileURL = getFileURL(id, projectName)
  const [fileContent, setFileContent] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await fetch(fileURL)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const text = await response.text()
        setFileContent(text)
      } catch (err) {
        setError(err.message)
      }
    }

    fetchFile()
  }, [projectName, id])

  if (error) {
    return <div>Error: {error}</div>
  }

  // if markdown file, return markdown
  if (mime?.includes('markdown'))
    return <Markdown remarkPlugins={[remarkGfm, emoji]}>{fileContent}</Markdown>

  return <CodeEditorPreview value={fileContent} language={extension} readOnly />
}

export default TextMime
