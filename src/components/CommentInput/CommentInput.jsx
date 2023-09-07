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

  // MENTION STATES
  const [mention, setMention] = useState(null)
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

  const mentionDenotationChars = ['@', '@@', '@@@']
  mentionDenotationChars.sort((a, b) => b.length - a.length)

  const handleChange = (content, delta, _, editor) => {
    setEditorValue(content)

    const isDelete = delta.ops.length === 2 && delta.ops[1].delete

    let currentCharacter =
      (delta.ops[0] && delta.ops[0].insert) || (delta.ops[1] && delta.ops[1].insert)
    if (!currentCharacter && isDelete) {
      currentCharacter = editor.getText(delta.ops[0].retain - 1, 1)
    }

    const isMention = mentionDenotationChars.includes(currentCharacter)

    if (isMention) {
      const mentionIndex = delta.ops.findIndex((op) => 'insert' in op || 'delete' in op)
      const mention = currentCharacter
      let retain = mentionIndex === 0 ? 0 : delta.ops[mentionIndex - 1].retain
      if (isDelete) retain = retain - 1

      // for each mention denotation char, check if it is a mention
      // sort by length of mention denotation char
      let mentionMatch = null

      // loop through each mention denotation char, with longest first. First one to match is the one we want
      for (const chars of mentionDenotationChars) {
        let isMatch = true
        // start with the last character
        if (chars.endsWith(mention)) {
          // loop through the chars backwards
          for (let i = chars.length - 1; i >= 0; i--) {
            // skip first character as that's already been checked
            if (i === 0) continue
            const char = chars[i - 1]
            const indexInDelta = retain - (chars.length - i)
            const valueCharAtIndex = editor.getText(indexInDelta, 1)
            if (valueCharAtIndex !== char) {
              isMatch = false
              break
            }
          }
        } else {
          isMatch = false
        }

        if (isMatch) {
          // console.log('match!!!', chars)
          mentionMatch = chars
          break
        }
      }

      if (mentionMatch) {
        const bounds = editor.getBounds(retain - (mentionMatch.length - 1))
        console.log('mention match!', mentionMatch, bounds)
        if (bounds) {
          setMention({
            bounds: bounds,
            type: mentionMatch,
            retain: retain,
          })
        }
      } else {
        setMention(null)
      }
    } else {
      if (mention) {
        // if space is pressed, remove mention
        if (currentCharacter === ' ') {
          setMention(null)
          return
        }

        // get full string between mention and new delta
        const retain = delta.ops[0].retain
        let distanceMentionToRetain = retain - mention.retain
        if (!isDelete) distanceMentionToRetain++
        const mentionFull = editor.getText(mention.retain, distanceMentionToRetain)
        const mentionSearch = mentionFull.replace(mention.type, '')
        //  check for space in mentionFull
        if (mentionFull.includes(' ')) {
          setMention(null)
        } else {
          setMention({
            ...mention,
            search: mentionSearch,
          })
        }
      }
    }
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
    <>
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
        {mention && (
          <Styled.Mention
            style={{
              left: mention.bounds.left,
              top: mention.bounds.top + mention.bounds.height,
              width: 100,
            }}
          >
            {mention.type} {mention.search}
          </Styled.Mention>
        )}
      </Styled.AutoHeight>
    </>
  )
}

export default CommentInput
