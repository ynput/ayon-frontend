import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as Styled from './CommentInput.styled'
import { Button, SaveButton } from '@ynput/ayon-react-components'
import 'react-quill/dist/quill.bubble.css'
import TurndownService from 'turndown'
import ReactMarkdown from 'react-markdown'
import ReactQuill from 'react-quill'
import { toast } from 'react-toastify'
import { confirmDialog } from 'primereact/confirmdialog'
import CommentMentionSelect from '../CommentMentionSelect/CommentMentionSelect'
import getMentionOptions from '/src/containers/Feed/mentionHelpers/getMentionOptions'
import getMentionUsers from '/src/containers/Feed/mentionHelpers/getMentionUsers'
import { useGetMentionTasksQuery } from '/src/services/userDashboard/getUserDashboard'
import getMentionTasks from '/src/containers/Feed/mentionHelpers/getMentionTasks'

const CommentInput = ({
  initValue,
  onSubmit,
  isOpen,
  setIsOpen,
  activeUsers,
  selectedTasksProjects,
  userName,
}) => {
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

  const { data: mentionTasks } = useGetMentionTasksQuery(
    { projectName: selectedTasksProjects[0], assignee: userName },
    {
      skip: selectedTasksProjects?.length !== 1,
    },
  )

  // CONFIG
  const placeholder = `Comment or tag with @user, @@version, @@@task...`

  var turndownService = new TurndownService()

  const mentionTypes = ['@', '@@', '@@@']
  const typeOptions = {
    '@': {
      id: 'user',
      isCircle: true,
    },
    '@@': {
      id: 'version',
    },
    '@@@': {
      id: 'task',
    },
  }
  mentionTypes.sort((a, b) => b.length - a.length)

  const mentionOptions = useMemo(
    () =>
      getMentionOptions(
        mention?.type,
        {
          '@': () => getMentionUsers(activeUsers),
          '@@@': () => getMentionTasks(mentionTasks),
        },
        mention?.search,
      ),
    [activeUsers, mention?.type, mention?.search],
  )

  console.log(mentionOptions)

  // triggered when a mention is selected
  const [newSelection, setNewSelection] = useState()

  useEffect(() => {
    if (newSelection) {
      setNewSelection(null)
      console.log(editorValue)
      // now we set selection to the end of the mention
      const quill = editorRef.current.getEditor()
      quill.setSelection(newSelection)
    }
  }, [newSelection])

  const handleSelectMention = (selectedOption, retain) => {
    // get option text
    const quill = editorRef.current.getEditor()
    // insert space instead of tab or enter
    const replace = mention.type + (mention.search || '')
    const mentionText = mention.type + selectedOption.label
    const newString = `<a href="@${selectedOption.id}">${mentionText}</a>&nbsp;`
    const newContent = editorValue.replace(replace, newString)

    const deltaContent = quill.clipboard.convert(newContent)

    quill.setContents(deltaContent, 'silent')

    const newSelection = retain + (selectedOption.label.length - (mention.search?.length || 0)) + 1
    setNewSelection(newSelection)
    setMention(null)
  }

  const handleSelectChange = (option) => {
    // get current selection position
    const quill = editorRef.current.getEditor()
    const selection = quill.getSelection()

    handleSelectMention(option, selection.index)
  }

  const handleChange = (content, delta, _, editor) => {
    let currentCharacter =
      (delta.ops[0] && delta.ops[0].insert) || (delta.ops[1] && delta.ops[1].insert)

    const tabOrEnter = currentCharacter === '\n' || currentCharacter === '\t'
    // find the first option
    const selectedOption = mentionOptions[0]

    if (mention && tabOrEnter && selectedOption) {
      // get option text
      const retain = (delta.ops[0] && delta.ops[0].retain) || 0

      return handleSelectMention(selectedOption, retain)
    }

    setEditorValue(content)

    const isDelete = delta.ops.length === 2 && delta.ops[1].delete

    if (!currentCharacter && isDelete) {
      currentCharacter = editor.getText(delta.ops[0].retain - 1, 1)
    }

    const isMention = mentionTypes.includes(currentCharacter)

    if (isMention) {
      const mentionIndex = delta.ops.findIndex((op) => 'insert' in op || 'delete' in op)
      const mention = currentCharacter
      let retain = mentionIndex === 0 ? 0 : delta.ops[mentionIndex - 1].retain
      if (isDelete) retain = retain - 1

      // for each mention denotation char, check if it is a mention
      // sort by length of mention denotation char
      let mentionMatch = null

      // loop through each mention denotation char, with longest first. First one to match is the one we want
      for (const chars of mentionTypes) {
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
        setMention({
          type: mentionMatch,
          retain: retain,
        })
      } else {
        setMention(null)
      }
    } else {
      // This is where SEARCH is handled
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
        console.log(mention.type)
        const mentionSearch = mentionFull.replace(mention.type.slice(-1), '')
        //  check for space in mentionFull
        if (mentionFull.includes(' ')) {
          setMention(null)
        } else {
          setMention({
            ...mention,
            search: mentionSearch?.toLowerCase(),
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

    // [@Luke Inderwick](@Innders) -> @[Luke Inderwick](Innders)
    // [@@Luke Inderwick](@@Innders) -> @@[Luke Inderwick](Innders)

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

    if (mention && e.key === 'Tab') {
      e.preventDefault()
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
        <CommentMentionSelect
          mention={mention}
          options={mentionOptions}
          onChange={handleSelectChange}
          types={mentionTypes}
          config={typeOptions[mention?.type]}
        />
      </Styled.AutoHeight>
    </>
  )
}

export default CommentInput
