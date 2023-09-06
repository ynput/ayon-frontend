import React, { useEffect, useRef, useState } from 'react'
import * as Styled from './CommentInput.styled'
import { Button, SaveButton } from '@ynput/ayon-react-components'
import 'react-quill/dist/quill.bubble.css'
import TurndownService from 'turndown'
import ReactMarkdown from 'react-markdown'
import ReactQuill from 'react-quill'
import { toast } from 'react-toastify'
import { confirmDialog } from 'primereact/confirmdialog'

const CommentInput = ({ initValue, onSubmit, isOpen, setIsOpen }) => {
  const [initHeight, setInitHeight] = useState(88)

  const [editorValue, setEditorValue] = useState('')

  // REFS
  const editorRef = useRef(null)
  const markdownRef = useRef(null)

  // Set initial value
  useEffect(() => {
    if (markdownRef.current && initValue) {
      // convert markdown to html
      const html = markdownRef.current.innerHTML
      setEditorValue(html)
      // set html to editor
      // get height of markdown
      const height = markdownRef.current.offsetHeight
      setInitHeight(height)
    }
  }, [initValue, markdownRef.current])

  // CONFIG
  const placeholder = `Comment or tag with @user, @@version, @@@task...`

  var turndownService = new TurndownService()

  const handleChange = (e) => {
    setEditorValue(e)
  }

  const convertToMarkdown = () => {
    const editor = editorRef.current.getEditor()
    const unprivilegedEditor = editorRef.current.makeUnprivilegedEditor(editor)
    const html = unprivilegedEditor.getHTML()

    // convert to markdown
    const markdown = turndownService.turndown(html)

    return markdown
  }

  const handleSubmit = () => {
    try {
      // convert to markdown
      const markdown = convertToMarkdown()

      if (markdown && onSubmit) {
        onSubmit(markdown)
        setEditorValue('')
      }
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong')
    }
  }

  const handleOpenClick = () => {
    if (isOpen) return

    setIsOpen(true)
    editorRef.current.getEditor().enable()
    editorRef.current.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit()
    }
    if (e.key === 'Escape') {
      const markdown = editorValue && convertToMarkdown()

      if (markdown) {
        confirmDialog({
          message: 'Are you sure you want to discard your changes?',
          header: 'Confirmation',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
            setIsOpen(false)
            setEditorValue('')
          },
        })
      } else {
        setIsOpen(false)
      }
    }
  }

  return (
    <Styled.AutoHeight
      style={{
        translate: isOpen ? '0' : '0 50px',
        marginTop: isOpen ? '0' : '-50px',
      }}
    >
      <Styled.Comment
        $isOpen={isOpen}
        className="block-shortcuts"
        onKeyDown={handleKeyDown}
        onClick={handleOpenClick}
      >
        <Styled.Markdown ref={markdownRef}>
          {/* this is purely used to translate the markdown into html for Editor */}
          <ReactMarkdown>{initValue}</ReactMarkdown>
        </Styled.Markdown>
        <ReactQuill
          theme="bubble"
          style={{ minHeight: isOpen ? initHeight : 44, maxHeight: 300 }}
          ref={editorRef}
          value={editorValue}
          onChange={handleChange}
          readOnly={!isOpen}
          placeholder={placeholder}
        />

        <Styled.Footer>
          <Styled.Commands>
            {/* mention a user */}
            <Button icon="alternate_email" />
            {/* mention a version */}
            <Button icon="layers" />
            {/* mention a task */}
            <Button icon="check_circle" />
            {/* attache a file */}
            <Button icon="attach_file_add" />
          </Styled.Commands>
          <SaveButton
            label="Comment"
            className="comment"
            active={!!editorValue}
            onClick={handleSubmit}
          />
        </Styled.Footer>
      </Styled.Comment>
    </Styled.AutoHeight>
  )
}

export default CommentInput
