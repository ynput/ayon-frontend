import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as Styled from './CommentInput.styled'
import { Button, Icon, SaveButton } from '@ynput/ayon-react-components'
import 'react-quill-ayon/dist/quill.bubble.css'

import ReactQuill from 'react-quill-ayon'
import { classNames } from 'primereact/utils'

import { toast } from 'react-toastify'
import CommentMentionSelect from '../CommentMentionSelect/CommentMentionSelect'
import getMentionOptions from '/src/containers/Feed/mentionHelpers/getMentionOptions'
import getMentionUsers from '/src/containers/Feed/mentionHelpers/getMentionUsers'
import { useGetTaskMentionTasksQuery } from '/src/services/userDashboard/getUserDashboard'
import getMentionTasks from '/src/containers/Feed/mentionHelpers/getMentionTasks'
import getMentionVersions from '/src/containers/Feed/mentionHelpers/getMentionVersions'
import {
  convertToMarkdown,
  handleFileDrop,
  parseImages,
  getUsersContext,
  typeWithDelay,
} from './helpers'
import useInitialValue from './hooks/useInitialValue'
import useSetCursorEnd from './hooks/useSetCursorEnd'
import InputMarkdownConvert from './InputMarkdownConvert'
import FilesGrid from '/src/containers/FilesGrid/FilesGrid'
import { useGetTeamsQuery } from '/src/services/team/getTeams'
import { useSelector } from 'react-redux'
import { getModules, quillFormats } from './modules'

const CommentInput = ({
  initValue,
  initFiles = [],
  onSubmit,
  isOpen,
  onClose,
  onOpen,
  activeUsers,
  projectName,
  entities = [],
  versions = [],
  projectInfo,
  isEditing,
  filter,
  disabled,
}) => {
  const currentUser = useSelector((state) => state.user.name)

  const [initHeight, setInitHeight] = useState(88)
  const [editorValue, setEditorValue] = useState('')
  // file uploads
  const [files, setFiles] = useState(initFiles)
  const [filesUploading, setFilesUploading] = useState([])
  const [isDropping, setIsDropping] = useState(false)

  // MENTION STATES
  const [mention, setMention] = useState(null)
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0)
  // REFS
  const editorRef = useRef(null)
  const markdownRef = useRef(null)

  // if there is an initial value, set it so the editor is prefilled
  useInitialValue({ markdownRef, initValue, setEditorValue, setInitHeight, isOpen, filter })

  // When editing, set selection to the end of the editor
  useSetCursorEnd({ initHeight, editorRef, isEditing })

  // for the task (entity), get all folderIds
  const folderIds = entities.flatMap((entity) => entity.folderId || [])

  const { data: mentionTasks = [] } = useGetTaskMentionTasksQuery(
    { projectName, folderIds },
    {
      skip: !projectName || !folderIds.length,
    },
  )

  // only load in teams when mention is started
  const { data: teams = [] } = useGetTeamsQuery({ projectName }, { skip: !mention || !projectName })

  // filter out the tasks that are currently selected
  const siblingTasks = mentionTasks.filter(
    (task) => !entities.some((entity) => entity.id === task.id),
  )
  // CONFIG
  let placeholder = isOpen
    ? `Comment or mention with @user, @@version, @@@task...`
    : 'Add a comment...'

  if (disabled) placeholder = 'Commenting is disabled across multiple projects.'

  // update placeholder on editor when isOpen
  useEffect(() => {
    const quill = editorRef.current.getEditor()
    if (quill) {
      const container = quill.container
      container?.firstChild?.setAttribute('data-placeholder', placeholder)
    }
  }, [isOpen, editorRef, disabled])

  const mentionTypes = ['@', '@@', '@@@']
  const typeOptions = {
    '@@@': {
      id: 'task',
    },
    '@@': {
      id: 'version',
    },
    '@': {
      id: 'user',
      isCircle: true,
    },
  }
  mentionTypes.sort((a, b) => b.length - a.length)

  // sort users by author or in assignees (users array on entity)
  const sortedUsers = useMemo(
    () => getUsersContext({ users: activeUsers, entities, teams, currentUser }),
    [activeUsers, entities, currentUser, teams],
  )

  const mentionOptions = useMemo(
    () =>
      getMentionOptions(
        mention?.type,
        {
          '@': () => getMentionUsers(sortedUsers),
          '@@': () => getMentionVersions(versions),
          '@@@': () => getMentionTasks(siblingTasks, projectInfo.task_types, projectName),
        },
        mention?.search,
      ),
    [sortedUsers, mention?.type, mention?.search],
  )

  // show first 5 and filter itself out
  const shownMentionOptions = mentionOptions.slice(0, 5)

  // triggered when a mention is selected
  const [newSelection, setNewSelection] = useState()

  useEffect(() => {
    if (newSelection) {
      setNewSelection(null)
      // now we set selection to the end of the mention
      const quill = editorRef.current.getEditor()
      quill.setSelection(newSelection)
    }
  }, [newSelection])

  const findStartAndEndIndexes = (string) => {
    const start = editorValue.indexOf(string)
    if (start === -1) return []
    const end = start + string.length
    return { start, end }
  }

  const handleSelectMention = (selectedOption, retain) => {
    // get option text
    const quill = editorRef.current.getEditor()
    // insert space instead of tab or enter
    const replace = mention.type + (mention.search || '')
    const mentionText = mention.type + selectedOption.label
    const type = typeOptions[mention.type]
    const href = `${type?.id}:${selectedOption.id}`

    // find all previous mentions (a tags) in the editor
    const previousMentions = quill.getContents().ops.filter((op) => op.attributes?.link)

    // find the start and end index of all the found mentions
    const previousMentionsIndexes = previousMentions.reduce((acc, op) => {
      const indexes = []
      if (op.attributes?.link) {
        indexes.push(findStartAndEndIndexes(op.attributes.link))
      }
      if (op.insert) {
        indexes.push(findStartAndEndIndexes(op.insert))
      }
      acc.push(...indexes)
      return acc
    }, [])

    // find all indexes of replace in the editor
    var replaceIndexes = []
    for (var i = 0; i < editorValue.length; i++) {
      if (editorValue.substring(i, i + replace.length) === replace) {
        // check that the i is not between the start and end indexes of a found mentions
        const isBetween = previousMentionsIndexes.some((index) => i >= index.start && i < index.end)
        if (!isBetween) {
          replaceIndexes.push(i)
        }
      }
    }

    if (replaceIndexes.length === 0) {
      return toast.error('Could not find mention in editor. Please try again.')
    }

    const replaceStartIndex = replaceIndexes[0]
    const replaceEndIndex = replaceStartIndex + replace.length

    // remove the original search mention by deleting the text from start to finish
    const editorValueWithoutMention =
      editorValue.slice(0, replaceStartIndex) + editorValue.slice(replaceEndIndex)

    const newString = `<a href="@${href}">${mentionText}</a>&nbsp;`

    // now add the new mention in at the same index
    const editorValueWithNewMention =
      editorValueWithoutMention.slice(0, replaceStartIndex) +
      newString +
      editorValueWithoutMention.slice(replaceStartIndex)

    const deltaContent = quill.clipboard.convert(editorValueWithNewMention)

    quill.setContents(deltaContent, 'silent')

    const newSelection = retain + (selectedOption.label.length - (mention.search?.length || 0)) + 1
    setNewSelection(newSelection)
    setMention(null)
    setMentionSelectedIndex(0)
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
    const selectedOption = mentionOptions[mentionSelectedIndex]

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
        setMentionSelectedIndex(0)
      }
    } else {
      // get full string between mention and new delta
      // This is where SEARCH is handled
      if (mention) {
        const retain = delta.ops[0].retain
        // if space is pressed, remove mention
        if (currentCharacter === ' ' || !retain) {
          setMention(null)
          setMentionSelectedIndex(0)
          return
        }

        let distanceMentionToRetain = retain - mention.retain
        if (!isDelete) distanceMentionToRetain++
        const mentionFull = editor.getText(mention.retain, distanceMentionToRetain)
        const mentionSearch = mentionFull.replace(mention.type.slice(-1), '')
        //  check for space in mentionFull
        if (mentionFull.includes(' ')) {
          setMention(null)
          setMentionSelectedIndex(0)
        } else {
          setMention({
            ...mention,
            search: mentionSearch?.toLowerCase(),
          })
        }
      }
    }
  }

  const addTextToEditor = (type) => {
    // get editor retain
    const quill = editorRef.current.getEditor()

    let retain = quill.getSelection()?.index || 0

    // get character at retain
    const currentCharacter = quill.getText(retain - 1, 1)

    // if the current character is a character, increment retain
    const addSpace = currentCharacter !== ' ' && currentCharacter
    if (addSpace) {
      quill.insertText(retain, ' ')
      retain++
    }

    // This is hack AF, but it works
    typeWithDelay(quill, retain, type)
  }

  const handleSubmit = async () => {
    try {
      // convert to markdown
      const markdown = convertToMarkdown(editorValue)
      // remove img query params
      const markdownParsed = parseImages(markdown)

      if ((markdownParsed || files.length) && onSubmit) {
        try {
          await onSubmit(markdownParsed, files)
          // only clear if onSubmit is successful
          setEditorValue('')
          setFiles([])
        } catch (error) {
          // error is handled in rtk query mutation
          return
        }
      }
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong')
    }
  }

  const handleOpenClick = () => {
    if (isOpen || disabled) return

    onOpen && onOpen()
    editorRef.current.getEditor().enable()
    editorRef.current.focus()
  }

  const handleClose = () => {
    // always close editor
    onClose && onClose()
    // get editor value
    const editor = editorRef.current.getEditor()
    const text = editor.getText()
    if (text.length < 2 || isEditing) {
      setEditorValue('')
    }
  }

  const handleKeyDown = (e) => {
    if (mention) {
      // close mention on escape
      if (e.key === 'Escape') {
        setMention(null)
        setMentionSelectedIndex(0)
        return
      }

      // add top search of mention
      if (mention && e.key === 'Tab') {
        // we handle this in the onChange
      }

      const arrowDirection = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0

      if (arrowDirection) {
        // navigate through mentions
        e.preventDefault()
        let newIndex = mentionSelectedIndex + arrowDirection
        if (newIndex < 0) newIndex = shownMentionOptions.length - 1
        if (newIndex >= shownMentionOptions.length) newIndex = 0
        setMentionSelectedIndex(newIndex)
      }

      if (e.key === 'Enter') {
        // we handle this in the onChange
      }
    }

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit()
    }

    if (e.key === 'Escape') {
      handleClose()
    }
  }

  const handleFileUpload = ({ file, data }) => {
    const newFile = {
      id: data.id,
      name: file.name,
      mime: file.type,
      size: file.size,
      order: files.length,
    }

    setFiles((prev) => [...prev, newFile])
    // remove from uploading
    setFilesUploading((prev) => prev.filter((uploading) => uploading.name !== file.name))
  }

  const handleFileRemove = (id, name) => {
    // remove file from files
    setFiles((prev) => prev.filter((file) => file.id !== id))
    // remove from uploading
    setFilesUploading((prev) => {
      console.log(prev)
      return prev.filter((file) => file.name !== name)
    })
  }

  const handleFileProgress = (e, file) => {
    const progress = Math.round((e.loaded * 100) / e.total)
    if (progress !== 100) {
      const uploadProgress = {
        name: file.name,
        progress,
        type: file.type,
        order: files.length + filesUploading.length,
      }

      setFilesUploading((prev) => {
        // replace or add new progress
        const newProgress = prev.filter((name) => name.name !== file.name)
        return [...newProgress, uploadProgress]
      })
    }
  }

  // when a file is not dropped onto the comment input
  const handleDrop = (e) => {
    setIsDropping(false)
    // upload file
    handleFileDrop(e, projectName, handleFileProgress, handleFileUpload)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropping(true)
  }

  let quillMinHeight = isOpen ? initHeight + 41 : 44
  if (isEditing) quillMinHeight = undefined

  // QUILL CONFIG
  const modules = useMemo(
    () =>
      getModules({
        imageUploader: {
          projectName,
          onUpload: handleFileUpload,
          onUploadProgress: handleFileProgress,
        },
      }),
    [projectName, setFiles, setFilesUploading],
  )

  const allFiles = [...(files || []), ...filesUploading].sort((a, b) => a.order - b.order)
  const compactGrid = allFiles.length > 6

  return (
    <>
      <Styled.AutoHeight
        className={classNames({ isOpen, isEditing })}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDropping(false)}
        onDrop={handleDrop}
        onClick={() => setIsDropping(false)}
      >
        <Styled.Comment
          className={classNames('block-shortcuts', {
            isOpen,
            isClosed: !isOpen || disabled,
            isEditing,
            isDropping,
            disabled,
          })}
          onKeyDown={handleKeyDown}
          onClick={handleOpenClick}
        >
          <Styled.Markdown ref={markdownRef}>
            {/* this is purely used to translate the markdown into html for Editor */}
            <InputMarkdownConvert typeOptions={typeOptions} initValue={initValue} />
          </Styled.Markdown>

          {/* file uploads */}
          <FilesGrid
            files={allFiles}
            isCompact={compactGrid}
            onRemove={handleFileRemove}
            style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}
            projectName={projectName}
          />
          {/* QUILL is configured in helpers file */}
          <ReactQuill
            theme="snow"
            style={{ minHeight: quillMinHeight, maxHeight: 300 }}
            ref={editorRef}
            value={editorValue}
            onChange={handleChange}
            readOnly={!isOpen || disabled}
            placeholder={placeholder}
            modules={modules}
            formats={quillFormats}
          />

          <Styled.Footer>
            <Styled.Buttons>
              {/* mention a user */}
              <Button
                icon="person"
                variant="text"
                onClick={() => addTextToEditor('@')}
                data-tooltip={'Mention user'}
                data-shortcut={'@'}
              />
              {/* mention a version */}
              <Button
                icon="layers"
                variant="text"
                onClick={() => addTextToEditor('@@')}
                data-tooltip={'Mention version'}
                data-shortcut={'@@'}
              />
              {/* mention a task */}
              <Button
                icon="check_circle"
                variant="text"
                onClick={() => addTextToEditor('@@@')}
                data-tooltip={'Mention task'}
                data-shortcut={'@@@'}
              />
            </Styled.Buttons>
            <Styled.Buttons>
              {isEditing && (
                <Button variant="text" onClick={handleClose}>
                  Cancel
                </Button>
              )}
              <SaveButton
                label={isEditing ? 'Save' : 'Comment'}
                className="comment"
                active={!!editorValue || !!files.length}
                onClick={handleSubmit}
              />
            </Styled.Buttons>
          </Styled.Footer>

          <Styled.Dropzone className={classNames({ show: isDropping && isOpen })}>
            <Icon icon="cloud_upload" />
          </Styled.Dropzone>
        </Styled.Comment>
        <CommentMentionSelect
          mention={mention}
          options={shownMentionOptions}
          onChange={handleSelectChange}
          types={mentionTypes}
          config={typeOptions[mention?.type]}
          noneFound={!shownMentionOptions.length && mention?.search}
          noneFoundAtAll={!shownMentionOptions.length && !mention?.search}
          selectedIndex={mentionSelectedIndex}
        />
      </Styled.AutoHeight>
    </>
  )
}

export default CommentInput
