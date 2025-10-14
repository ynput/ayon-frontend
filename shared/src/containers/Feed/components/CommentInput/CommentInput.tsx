// React and related hooks
import React, { FC, useEffect, useMemo, useRef, useState } from 'react'

// Third-party libraries
import clsx from 'clsx'
import { toast } from 'react-toastify'
import ReactQuill, { Quill } from 'react-quill-ayon'

// Components
import { Button, Icon, SaveButton } from '@ynput/ayon-react-components'
import CommentMentionSelect from '../CommentMentionSelect/CommentMentionSelect'
import InputMarkdownConvert from './InputMarkdownConvert'
import FilesGrid from '../FilesGrid'

// Styled components
import * as Styled from './CommentInput.styled'
import { QuillListStyles } from '../../../../components/QuillListStyles'

// Helpers and utilities
import getMentionOptions from '../../mentionHelpers/getMentionOptions'
import getMentionUsers from '../../mentionHelpers/getMentionUsers'
import getMentionTasks from '../../mentionHelpers/getMentionTasks'
import getMentionVersions from '../../mentionHelpers/getMentionVersions'
import { convertToMarkdown } from './quillToMarkdown'
import { handleFileDrop, parseImages, typeWithDelay } from './helpers'
import { getModules, quillFormats } from './modules'

// Hooks
import useInitialValue from './hooks/useInitialValue'
import useSetCursorEnd from './hooks/useSetCursorEnd'
import useMentionLink from './hooks/useMentionLink'
import useAnnotationsSync from './hooks/useAnnotationsSync'
import { useBlendedCategoryColor } from './hooks/useBlendedCategoryColor'

// State management
import useAnnotationsUpload from './hooks/useAnnotationsUpload'
import { useFeedContext } from '../../context/FeedContext'
import { ActivityCategorySelect, isCategoryHidden, SavedAnnotationMetadata } from '../../index'
import { useDetailsPanelContext } from '@shared/context'

var Delta = Quill.import('delta')

const mentionTypes = ['@', '@@', '@@@']
export const mentionTypeOptions = {
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

interface CommentInputProps {
  initValue: string | null
  initFiles?: any[]
  initCategory?: string | null
  onSubmit: (markdown: string, files: any[], data?: any) => Promise<void>
  isEditing?: boolean
  disabled?: boolean
  isLoading?: boolean
  isOpen: boolean
  onOpen?: () => void
  onClose?: () => void
}

const CommentInput: FC<CommentInputProps> = ({
  initValue,
  initFiles = [],
  initCategory = null,
  onSubmit,
  isEditing,
  disabled,
  isLoading,
  isOpen,
  onOpen,
  onClose,
}) => {
  const {
    projectName,
    entities,
    projectInfo,
    scope,
    currentTab,
    mentionSuggestionsData,
    categories,
    isGuest,
  } = useFeedContext()

  const { hasLicense, onPowerFeature, user } = useDetailsPanelContext()
  const isUser = !user?.data?.isAdmin && !user?.data?.isManager

  const {
    users: mentionUsers,
    versions: mentionVersions,
    tasks: mentionTasks,
  } = mentionSuggestionsData || {}

  const [initHeight, setInitHeight] = useState(88)
  const [editorValue, setEditorValue] = useState('')
  // file uploads
  const [files, setFiles] = useState(initFiles)
  const [filesUploading, setFilesUploading] = useState([])
  const [isDropping, setIsDropping] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { annotations, removeAnnotation, goToAnnotation } = useAnnotationsSync({
    entityId: entities[0]?.id,
    filesUploading,
  })

  // MENTION STATES
  const [mention, setMention] = useState<null | any>(null)
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0)
  // CATEGORY STATE
  const [category, setCategory] = useState<null | string>(initCategory)
  const categoryOptions = categories.filter((cat) => cat.accessLevel >= 20)
  const categoryData = categories.find((cat) => cat.name === category)
  // Compute blended background color for category
  const blendedCategoryColor = useBlendedCategoryColor(categoryData?.color)
  // REFS
  const editorRef = useRef<any>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  const markdownRef = useRef<HTMLDivElement>(null)

  // if there is an initial value, set it so the editor is prefilled
  useInitialValue({
    markdownRef,
    initValue,
    setEditorValue,
    setInitHeight,
    isOpen: isOpen,
    filter: currentTab,
  })

  // When editing, set selection to the end of the editor
  useSetCursorEnd({ initHeight, editorRef, isEditing })
  // create a new quill format for mentions and registers it
  useMentionLink({ projectName })

  // focus on editor when opened
  useEffect(() => {
    if (isOpen) {
      editorRef.current?.getEditor()?.enable()
      // block autofocus if opened from an annotation
      if (annotations.length > 0 && files.length === 0) {
        return
      }

      editorRef.current?.focus()
    }
    // We don't set annotations or files as useEffect dependencies, because we don't want to focus
    // the input if it's already open but annotations change (e.g. are removed).
  }, [isOpen, editorRef])

  mentionTypes.sort((a, b) => b.length - a.length)

  const mentionOptions = useMemo(
    () =>
      getMentionOptions(
        mention?.type,
        {
          '@': () => getMentionUsers(mentionUsers),
          '@@': () => getMentionVersions(mentionVersions),
          '@@@': () => getMentionTasks(mentionTasks, projectInfo.taskTypes),
        },
        mention?.search,
      ),
    [mentionTasks, mentionVersions, mentionUsers, mention?.type, mention?.search],
  )

  // show first 5 and filter itself out
  const shownMentionOptions = mentionOptions.slice(0, 5)

  // triggered when a mention is selected
  const [newSelection, setNewSelection] = useState<null | number>()

  useEffect(() => {
    if (newSelection) {
      setNewSelection(null)
      // now we set selection to the end of the mention
      const quill = editorRef.current.getEditor()
      quill.setSelection(newSelection)
    }
  }, [newSelection])

  const handleSelectMention = (selectedOption: any) => {
    // get option text
    const quill = editorRef.current.getEditor()

    const typePrefix = mention.type // the type of mention: @, @@, @@@
    const search = typePrefix + (mention.search || '') // the full search string: @Tim
    const mentionLabel = typePrefix + selectedOption.label // the label of the mention: @Tim Bailey
    // @ts-expect-error
    const type = mentionTypeOptions[typePrefix] // the type of mention: user, version, task
    const href = `${type?.id}:${selectedOption.id}` // the href of the mention: user:user.123

    // get selection delta
    const selection = quill.getSelection(true)
    const selectionIndex = selection?.index || 0
    const startIndex = selectionIndex - search.length // the start index of the search

    // first delete the search string
    quill.deleteText(startIndex, search.length)

    //  insert embed link
    quill.insertText(startIndex, mentionLabel, 'mention', href)

    const endIndex = startIndex + mentionLabel.length

    // insert a space after the mention
    quill.updateContents(new Delta().retain(endIndex).insert(' '))

    // remove single \n after mention
    quill.updateContents(new Delta().retain(endIndex + 1).delete(1))

    // set selection to the end of the mention + 1
    setNewSelection(endIndex + 1)

    // reset mention state
    setMention(null)
    setMentionSelectedIndex(0)
  }

  const handleSelectChange = (option: any) => {
    handleSelectMention(option)
  }

  const handleChange = (content: string, delta: any, _: any, editor: any) => {
    let currentCharacter =
      (delta.ops[0] && delta.ops[0].insert) || (delta.ops[1] && delta.ops[1].insert)

    const tabOrEnter = currentCharacter === '\n' || currentCharacter === '\t'
    // find the first option
    const selectedOption = mentionOptions[mentionSelectedIndex]

    if (mention && tabOrEnter && selectedOption && !isGuest) {
      // get option text
      const retain = (delta.ops[0] && delta.ops[0].retain) || 0
      // prevent default

      // @ts-ignore
      handleSelectMention(selectedOption, retain)

      return
    }

    setEditorValue(content)

    const isDelete = delta.ops.length === 2 && !!delta.ops[1].delete

    if (!currentCharacter && isDelete) {
      currentCharacter = editor.getText(delta.ops[0].retain - 1, 1)
    }

    const isMention = mentionTypes.includes(currentCharacter)

    if (isMention) {
      const mentionIndex = delta.ops.findIndex((op: any) => 'insert' in op || 'delete' in op)
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
      } else {
        // just deleting any text
        const quill = editorRef.current.getEditor()
        const currentSelection = quill.getSelection(false)
        const currentFormat = quill.getFormat(currentSelection?.index, currentSelection?.length)
        if (currentFormat.mention) {
          // if format is mention, delete the whole mention
          const [lineBlock] = quill.getLine(currentSelection.index - 1) || []
          const ops = lineBlock?.cache?.delta?.ops || []
          // get last op with attributes mention: true
          const lastMentionOp = ops.reverse().find((op: any) => op.attributes?.mention)
          if (lastMentionOp) {
            const mentionLength = lastMentionOp.insert.length
            quill.deleteText(currentSelection.index - mentionLength, mentionLength)
          }
        }
      }
    }
  }

  const addTextToEditor = (type: string) => {
    // get editor retain
    const quill = editorRef.current.getEditor()

    let retain = quill.getSelection(true)?.index || 0

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

  const handleMentionButton = (type: string) => {
    // first check if mention is already open
    if (mention) {
      const { type, retain, search = '' } = mention

      const quill = editorRef.current.getEditor()
      const length = type.length + search.length
      const start = retain - type.length + 1
      // delete the mention
      quill.deleteText(start, length)
    }

    addTextToEditor(type)
  }

  const handleOpenClick = () => {
    if (isOpen || disabled) return

    onOpen && onOpen()
  }

  const handleClose = () => {
    // get editor value
    const editor = editorRef.current.getEditor()
    const text = editor.getText()
    if (text.length < 2 || isEditing) {
      setEditorValue('')
    }

    // always close editor
    onClose && onClose()
  }

  const handleFileUploaded = ({ file, data }: any) => {
    const newFile = {
      id: data.id,
      name: file.name,
      mime: file.type,
      size: file.size,
      order: files.length,
    }

    setFiles((prev) => [...prev, newFile])
    // remove from uploading
    setFilesUploading((prev) => prev.filter((uploading: any) => uploading.name !== file.name))

    return newFile
  }

  const handleFileRemove = (id: string, name: string, isUnsavedAnnotation: boolean) => {
    if (isUnsavedAnnotation) {
      // remove from annotations (if it's an unsaved annotation)
      removeAnnotation?.(id)
    } else {
      // remove file from files
      setFiles((prev) => prev.filter((file) => file.id !== id))
      // remove from uploading
      setFilesUploading((prev) => {
        return prev.filter((file: any) => file.name !== name)
      })
    }
  }

  const handleFileProgress = (e: any, file: any) => {
    const progress = Math.round((e.loaded * 100) / e.total)
    if (progress !== 100) {
      const uploadProgress = {
        name: file.name,
        progress,
        type: file.type,
        order: files.length + filesUploading.length,
      }

      // @ts-ignore
      setFilesUploading((prev) => {
        // replace or add new progress
        const newProgress = prev.filter((name: any) => name.name !== file.name)
        return [...newProgress, uploadProgress]
      })
    }
  }

  // when a file is not dropped onto the comment input
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDropping(false)
    // upload file
    handleFileDrop(e, projectName, handleFileProgress, handleFileUploaded)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropping(true)
  }

  const uploadAnnotations = useAnnotationsUpload({
    projectName,
    onSuccess: handleFileUploaded,
  })

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      // upload any annotations first
      let annotationFiles = []
      let annotationMetadata: SavedAnnotationMetadata[] = []

      if (annotations.length) {
        const { files, metadata } = await uploadAnnotations(annotations)
        annotationFiles = files
        annotationMetadata = metadata
      }

      // convert to markdown
      const [markdown] = convertToMarkdown(editorValue)

      // remove img query params
      const markdownParsed = parseImages(markdown)

      const uploadedFiles = [...files, ...annotationFiles]

      if ((markdownParsed || uploadedFiles.length) && onSubmit) {
        try {
          await onSubmit(markdownParsed, uploadedFiles, {
            annotations: annotationMetadata,
            category: isGuest ? null : category, // guests cannot set category (it is done by default on backend)
          })
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
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
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

  let quillMinHeight: number | undefined = isOpen ? initHeight + 41 : 44
  if (isEditing) quillMinHeight = undefined

  // QUILL CONFIG
  const modules = useMemo(
    () =>
      getModules({
        imageUploader: {
          projectName,
          onUpload: handleFileUploaded,
          onUploadProgress: handleFileProgress,
        },
      }),
    [projectName, setFiles, setFilesUploading],
  )

  const allFiles = [...annotations, ...(files || []), ...filesUploading].sort(
    (a, b) => a.order - b.order,
  )
  const compactGrid = allFiles.length > 3

  // disable version mentions for folders
  let mentionsError = null
  if (entities.length && entities[0].entityType === 'folder') {
    if (mention?.type === '@@') {
      mentionsError = 'Version mentions are disabled for folders'
    }
  }

  const getCommentPlaceholder = (isOpen?: boolean) => {
    if (disabled) {
      if (isGuest) return 'You do not have permission to comment.'
      return 'Commenting is disabled across multiple projects.'
    }

    if (isGuest || !isOpen) return 'Leave a comment'

    return 'Comment or mention with @user, @@version, @@@task...'
  }

  return (
    <>
      <Styled.AutoHeight
        className={clsx('comment-container', { isOpen, isEditing })}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDropping(false)}
        onDrop={handleDrop}
        onClick={() => setIsDropping(false)}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Styled.Comment
          className={clsx('block-shortcuts', {
            isOpen,
            isClosed: !isOpen || disabled,
            isEditing,
            isDropping,
            disabled,
            isLoading,
            isSubmitting,
            category: !!category && !isGuest,
          })}
          onKeyDown={handleKeyDown}
          onClick={handleOpenClick}
          $categoryPrimary={categoryData?.color}
          $categoryTertiary={blendedCategoryColor.primary}
          $categorySecondary={blendedCategoryColor.secondary}
        >
          <Styled.Markdown ref={markdownRef}>
            {/* this is purely used to translate the markdown into html for Editor */}
            <InputMarkdownConvert typeOptions={mentionTypeOptions} initValue={initValue} />
          </Styled.Markdown>

          {/* file uploads */}
          {isOpen && (
            <FilesGrid
              files={allFiles}
              isCompact={compactGrid}
              onRemove={handleFileRemove}
              style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}
              projectName={projectName}
              onAnnotationClick={goToAnnotation}
            />
          )}
          {isOpen && !disabled ? (
            <QuillListStyles ref={editorContainerRef}>
              {!isGuest && (
                <ActivityCategorySelect
                  value={category}
                  categories={categoryOptions}
                  onChange={(c) => setCategory(c)}
                  isCompact={isEditing}
                  hasPowerpack={hasLicense}
                  onPowerFeature={onPowerFeature}
                  isHidden={isCategoryHidden(categoryOptions, { isGuest, isUser })}
                  style={{
                    position: isEditing ? 'relative' : 'absolute',
                    left: 4,
                    top: isEditing ? 0 : 4,
                  }}
                />
              )}

              <ReactQuill
                theme="snow"
                style={{ minHeight: quillMinHeight, maxHeight: 300 }}
                ref={editorRef}
                value={editorValue}
                onChange={handleChange}
                readOnly={!isOpen}
                placeholder={getCommentPlaceholder(true)}
                modules={modules}
                formats={quillFormats}
              />
            </QuillListStyles>
          ) : (
            <Styled.Placeholder>{getCommentPlaceholder()}</Styled.Placeholder>
          )}

          <Styled.Footer>
            {!isGuest && (
              <Styled.Buttons>
                {/* mention a user */}
                <Button
                  icon="person"
                  variant="text"
                  onClick={() => handleMentionButton('@')}
                  data-tooltip={'Mention user'}
                  data-shortcut={'@'}
                />
                {/* mention a version */}
                <Button
                  icon="layers"
                  variant="text"
                  onClick={() => handleMentionButton('@@')}
                  data-tooltip={'Mention version'}
                  data-shortcut={'@@'}
                />
                {/* mention a task */}
                <Button
                  icon="check_circle"
                  variant="text"
                  onClick={() => handleMentionButton('@@@')}
                  data-tooltip={'Mention task'}
                  data-shortcut={'@@@'}
                />
              </Styled.Buttons>
            )}
            <Styled.Buttons style={{ marginLeft: 'auto' }}>
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
                disabled={isLoading}
              />
            </Styled.Buttons>
          </Styled.Footer>

          <Styled.Dropzone className={clsx({ show: isDropping && isOpen })}>
            <Icon icon="cloud_upload" />
          </Styled.Dropzone>
        </Styled.Comment>
        <CommentMentionSelect
          mention={mention}
          options={shownMentionOptions}
          onChange={handleSelectChange}
          types={mentionTypes}
          // @ts-ignore
          config={mentionTypeOptions[mention?.type]}
          noneFound={!shownMentionOptions.length && mention?.search}
          noneFoundAtAll={!shownMentionOptions.length && !mention?.search}
          selectedIndex={mentionSelectedIndex}
          // @ts-ignore
          error={mentionsError}
          isGuest={isGuest}
        />
      </Styled.AutoHeight>
    </>
  )
}

export default CommentInput
