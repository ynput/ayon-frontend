// React and related hooks
import React, { FC, useEffect, useMemo, useRef, useState } from 'react'

// Third-party libraries
import clsx from 'clsx'
import { toast } from 'react-toastify'
import { $createListItemNode, $createListNode } from '@lexical/list'
import { $getRoot } from 'lexical'
import { v4 as uuid } from 'uuid'

// Components
import { Button, Icon, SaveButton, type IconType } from '@ynput/ayon-react-components'
import {
  MarkdownEditor,
  createFeedMentionSource,
  getInlineMediaFileIds,
  normalizeLegacyMarkdown,
  type EditorCommand,
  type MarkdownEditorHandle,
  type MentionTrigger,
  type UploadMedia,
} from '@shared/components/MarkdownEditor'
import FilesGrid from '../FilesGrid'

// Styled components
import * as Styled from './CommentInput.styled'

// Helpers and utilities
import { handleFileDrop, parseImages, uploadFile } from './helpers'

// Hooks
import useAnnotationsSync from './hooks/useAnnotationsSync'
import { useBlendedCategoryColor } from './hooks/useBlendedCategoryColor'
import useReferenceTooltip from '../../hooks/useReferenceTooltip'

// State management
import useAnnotationsUpload from './hooks/useAnnotationsUpload'
import { useFeedContext } from '../../context/FeedContext'
import { ActivityCategorySelect, isCategoryHidden, SavedAnnotationMetadata } from '../../index'
import { useDetailsPanelContext } from '@shared/context/DetailsPanelContext'
import { useProjectContext } from '@shared/context/ProjectContext'
import { parseFilename } from '@shared/util/parseFilename'
import type { DetailsPanelEntityType, FeedActivity } from '@shared/api'
import { VersionReviewPill } from './VersionReviewPill'
import { VersionReviewFeedback, type CommentDuplicate } from './types'
import { cloneProjectFile } from './cloneProjectFile'
import { getActivityLink } from '../../helpers/getActivityLink'

type UploadingFile = {
  name: string
  progress: number
  type: string
  order: number
}

interface CommentInputProps {
  initValue: string | null
  initFiles?: any[]
  initCategory?: string | null
  data?: any
  versionReview: boolean
  lastOwnVersionReview?: FeedActivity
  onSubmit: (markdown: string, files: any[], data?: any) => Promise<void>
  onReview?: (feedback: VersionReviewFeedback) => void
  // a comment to copy into this (new comment) input, with copies of its files
  duplicate?: CommentDuplicate | null
  onDuplicateHandled?: () => void
  isEditing?: boolean
  disabled?: boolean
  isLoading?: boolean
  isOpen: boolean
  onOpen?: () => void
  onClose?: () => void
}

const getProjectFileUrl = (projectName: string, id: string) =>
  `/api/projects/${projectName}/files/${id}`

// is the file shown as an image / video block in the markdown
// the file is shown as an image / video block in the markdown
const isReferenced = (id: string, markdown: string) =>
  !!id && getInlineMediaFileIds(markdown).has(id)

const MENTION_BUTTONS: { trigger: MentionTrigger; icon: IconType; tooltip: string }[] = [
  { trigger: '@', icon: 'person', tooltip: 'Mention user' },
  { trigger: '@@', icon: 'layers', tooltip: 'Mention version' },
  { trigger: '@@@', icon: 'check_circle', tooltip: 'Mention task' },
]

const CommentInput: FC<CommentInputProps> = ({
  initValue,
  initFiles = [],
  initCategory = null,
  data = {},
  versionReview,
  lastOwnVersionReview,
  onSubmit,
  onReview,
  duplicate,
  onDuplicateHandled,
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
    feedFilter,
    mentionSuggestionsData,
    categories,
    isGuest,
  } = useFeedContext()

  const { hasLicense, onPowerFeature, user, openSlideOut, commentFrameLink } =
    useDetailsPanelContext()
  const isAdmin = user?.data?.isAdmin

  const project = useProjectContext()
  const [, setRefTooltip] = useReferenceTooltip()

  // markdown of the comment
  const [editorValue, setEditorValue] = useState(initValue || '')
  // file uploads
  // attachments, plus the files of image / video blocks (`isInline`, shown in the text, not the grid)
  const [files, setFiles] = useState(() =>
    initFiles.map((file) =>
      isReferenced(file.id, initValue || '') ? { ...file, isInline: true } : file,
    ),
  )
  // image / video blocks being uploaded
  const [inlineUploads, setInlineUploads] = useState(0)
  // attachment uploads by file, for switching pasted media to inline
  const attachmentUploads = useRef(new Map<File, ReturnType<typeof uploadFile>>())
  const [filesUploading, setFilesUploading] = useState<UploadingFile[]>([])
  const [isDropping, setIsDropping] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedAnnotations, setUploadedAnnotations] = useState<SavedAnnotationMetadata[]>([])

  const { annotations, removeAnnotation, goToAnnotation } = useAnnotationsSync({
    entityId: entities[0]?.id,
    filesUploading,
  })

  // FRAME LINK: the host (e.g. a player) owns the draft link so it can show and move it
  const frameLinkEntity =
    entities.length === 1 && entities[0].entityType === 'version' ? entities[0] : undefined
  const frameLink =
    commentFrameLink?.draft && commentFrameLink.draft.entityId === frameLinkEntity?.id
      ? commentFrameLink.draft
      : null
  const showFrameLink = !!commentFrameLink && !!frameLinkEntity && !isEditing
  const formatFrame = commentFrameLink?.formatFrame ?? String
  const frameLinkLabel = frameLink
    ? frameLink.endFrame > frameLink.startFrame
      ? `${formatFrame(frameLink.startFrame)}-${formatFrame(frameLink.endFrame)}`
      : formatFrame(frameLink.startFrame)
    : undefined

  const handleFrameLinkButton = () => {
    if (!commentFrameLink || !frameLinkEntity) return
    if (frameLink) commentFrameLink.unlink()
    else commentFrameLink.link(frameLinkEntity.id)
  }

  // the same in the `/` menu
  const frameLinkCommands = useMemo<EditorCommand[] | undefined>(() => {
    if (!showFrameLink || !commentFrameLink || !frameLinkEntity) return undefined
    const keywords = ['frame', 'time', 'timecode', 'link', 'range']
    return [
      frameLink
        ? {
            id: 'frame-link',
            label: 'Remove frame link',
            icon: 'timer_off',
            keywords: [...keywords, 'unlink', 'remove'],
            hint: frameLinkLabel,
            run: () => commentFrameLink.unlink(),
          }
        : {
            id: 'frame-link',
            label: 'Link to current frame',
            icon: 'timer',
            keywords,
            run: () => commentFrameLink.link(frameLinkEntity.id),
          },
    ]
  }, [showFrameLink, commentFrameLink, frameLinkEntity?.id, !!frameLink, frameLinkLabel])

  // CATEGORY STATE
  const [category, setCategory] = useState<null | string>(initCategory)
  const categoryOptions = categories.filter((cat) => cat.accessLevel >= 20)
  const categoryData = categories.find((cat) => cat.name === category)
  // Compute blended background color for category
  const blendedCategoryColor = useBlendedCategoryColor(categoryData?.color)

  // REFS
  const editorRef = useRef<MarkdownEditorHandle>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasText = !!editorValue.trim()

  // the checklists filter starts a new comment with a checklist item
  const isChecklistsFilter = !!feedFilter?.conditions?.some(
    (c) => 'key' in c && c.key === 'checklists' && c.value === true,
  )
  useEffect(() => {
    if (!isOpen || isEditing || !isChecklistsFilter) return
    const handle = editorRef.current
    if (!handle || !handle.isEmpty()) return
    handle.getEditor().update(() => {
      const item = $createListItemNode(false)
      $getRoot().clear().append($createListNode('check').append(item))
      item.select()
    })
  }, [isOpen, isEditing, isChecklistsFilter])

  // MENTIONS
  const entityType = entities[0]?.entityType
  // keep the source stable, a new one resets the highlighted option of the picker
  const productTypes = project?.productTypes
  const mentions = useMemo(
    () =>
      isGuest
        ? undefined
        : {
            ...createFeedMentionSource({
              suggestions: mentionSuggestionsData,
              project: { productTypes },
              taskTypes: projectInfo?.taskTypes,
              entityType,
            }),
            // keep the picker short
            limit: 5,
          },
    [isGuest, mentionSuggestionsData, productTypes, projectInfo?.taskTypes, entityType],
  )

  const handleMentionClick = ({ type, id }: { type: string; id: string }) => {
    if (type === 'user' || type === 'team') return
    openSlideOut({ entityId: id, entityType: type as DetailsPanelEntityType, projectName })
  }

  const handleMentionHover = (
    { type, id, label }: { type: string; id: string; label: string },
    target: HTMLElement,
  ) => {
    // get the center of the reference
    const { x, y, width } = target.getBoundingClientRect()
    setRefTooltip({ id, name: id, type, label, pos: { left: x + width / 2, top: y } })
  }

  const handleOpenClick = () => {
    if (isOpen || disabled) return

    onOpen && onOpen()
  }

  const handleClose = () => {
    // keep a draft of a new comment, drop edits
    if (!hasText || isEditing) {
      setEditorValue('')
    }

    // always close editor
    onClose && onClose()
  }

  const handleFileUploaded = ({ file, data }: any, isAnnotationLayer = false) => {
    const fileName = parseFilename(file.name)
    const newFile = {
      id: data.id,
      name: fileName,
      mime: file.type,
      size: file.size,
      order: files.length,
      isAnnotationLayer,
    }

    setFiles((prev) => [...prev, newFile])
    // remove from uploading
    setFilesUploading((prev) =>
      prev.filter((uploading) => parseFilename(uploading.name) !== fileName),
    )

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
        return prev.filter((file) => parseFilename(file.name) !== parseFilename(name))
      })
    }
  }

  const handleFileProgress = (e: any, file: any) => {
    const progress = Math.round((e.loaded * 100) / e.total)
    if (progress !== 100) {
      const fileName = parseFilename(file.name)

      setFilesUploading((prev) => {
        const existing = prev.find((item) => parseFilename(item.name) === fileName)
        const newProgress = prev.filter((item) => parseFilename(item.name) !== fileName)
        const uploadProgress: UploadingFile = {
          name: fileName,
          progress,
          type: file.type,
          order: existing?.order ?? files.length + prev.length,
        }
        return [...newProgress, uploadProgress]
      })
    }
  }

  const removeFileUploading = (name: string) => {
    setFilesUploading((prev) => prev.filter((file) => file.name !== parseFilename(name)))
  }

  // files pasted or dropped into the editor, or picked with the attach button
  const uploadFiles = (newFiles: File[]) => {
    for (const file of newFiles) {
      const upload = uploadFile(file, projectName, handleFileProgress)
      // a pasted image / video can be switched to an inline block, which reuses this upload
      attachmentUploads.current.set(file, upload)
      upload.then(
        (data) => handleFileUploaded(data),
        (error) => {
          removeFileUploading(file.name)
          toast.error(error.message)
          console.warn(error)
        },
      )
    }
  }

  // image / video blocks: stored like attachments and linked to the comment, but shown in the text
  const uploadMedia: UploadMedia = async (file) => {
    setInlineUploads((count) => count + 1)
    try {
      const attachmentUpload = attachmentUploads.current.get(file)
      if (attachmentUpload) {
        // pasted as an attachment and switched to inline: same file, now shown in the text
        const { data } = await attachmentUpload
        setFiles((prev) => prev.map((f) => (f.id === data.id ? { ...f, isInline: true } : f)))
        return {
          src: getProjectFileUrl(projectName, data.id),
          name: parseFilename(file.name),
          mime: file.type,
        }
      }
      const { data } = await uploadFile(file, projectName, undefined)
      const name = parseFilename(file.name)
      setFiles((prev) => [
        ...prev,
        { id: data.id, name, mime: file.type, size: file.size, order: prev.length, isInline: true },
      ])
      return { src: getProjectFileUrl(projectName, data.id), name, mime: file.type }
    } catch (error: any) {
      // a failed attachment upload has already been reported
      if (!attachmentUploads.current.has(file)) toast.error(error?.message || 'Upload failed')
      throw error
    } finally {
      setInlineUploads((count) => count - 1)
    }
  }

  // when a file is dropped onto the comment input (the editor handles its own drops)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDropping(false)
    if (e.defaultPrevented) return
    // upload file
    handleFileDrop(e, projectName, handleFileProgress, handleFileUploaded, (file: File) =>
      removeFileUploading(file.name),
    )
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropping(true)
  }

  // DUPLICATE: copy another comment in to adapt and post it, e.g. client feedback for an artist.
  // The files are copied so the original comment is never changed, the text links back to it.
  const handledDuplicate = useRef<string | null>(null)
  const insertDuplicate = async ({ activity }: CommentDuplicate) => {
    const body = normalizeLegacyMarkdown(activity.body || '')
    const sourceFiles = activity.files || []
    const inlineIds = getInlineMediaFileIds(body)
    // annotations are drawn over the frames of the version, they only stay annotations there
    const keepAnnotations =
      entities.length === 1 && entities[0].id === (activity.origin?.id ?? activity.entityId)

    const appendText = (markdown: string) => {
      const link = `[Original comment](${getActivityLink(
        projectName,
        activity.activityId,
        activity.origin ??
          (activity.entityId && activity.entityType
            ? { id: activity.entityId, type: activity.entityType }
            : undefined),
      )})`
      const text = [markdown.trim(), link].filter(Boolean).join('\n\n')
      setEditorValue((prev) => (prev.trim() ? `${prev.trim()}\n\n${text}` : text))
      editorRef.current?.focus()
    }

    const cloneFile = async (source: (typeof sourceFiles)[number]) => {
      const isInline = inlineIds.has(source.id)
      try {
        // inline files have no card, they show up in the text when they are ready
        const upload = await cloneProjectFile(
          projectName,
          source.id,
          source.name,
          source.mime,
          isInline ? undefined : handleFileProgress,
        )
        if (isInline) {
          const { file, data } = upload
          const name = parseFilename(file.name)
          setFiles((prev) => [
            ...prev,
            { id: data.id, name, mime: file.type, size: file.size, order: prev.length, isInline },
          ])
        } else handleFileUploaded(upload)

        const annotation = source.annotation as SavedAnnotationMetadata | undefined
        if (annotation && keepAnnotations) {
          const layer = await cloneProjectFile(
            projectName,
            annotation.transparent,
            `annotation-${source.name}`,
            'image/png',
          )
          handleFileUploaded(layer, true)
          setUploadedAnnotations((prev) => [
            ...prev,
            { ...annotation, id: uuid(), composite: upload.data.id, transparent: layer.data.id },
          ])
        }
        return [source.id, upload.data.id] as const
      } catch (error) {
        removeFileUploading(source.name)
        toast.error(`Could not copy ${source.name}`)
        console.warn(error)
        return null
      }
    }

    // posting waits for the copies
    setInlineUploads((count) => count + 1)
    try {
      const inline = sourceFiles.filter((file) => inlineIds.has(file.id))
      const attachments = sourceFiles.filter((file) => !inlineIds.has(file.id))
      const attachmentCopies = Promise.all(attachments.map(cloneFile))
      if (inline.length) {
        // image / video blocks point to their copies, so the text waits for them
        const copies = new Map(
          (await Promise.all(inline.map(cloneFile))).filter(
            (c): c is readonly [string, string] => !!c,
          ),
        )
        appendText(
          body.replace(/(\/api\/projects\/[^/]+\/files\/)([\w-]+)/g, (match, path, id) =>
            copies.has(id) ? path + copies.get(id) : match,
          ),
        )
      } else appendText(body)
      await attachmentCopies
    } finally {
      setInlineUploads((count) => count - 1)
    }
  }

  useEffect(() => {
    if (!duplicate || handledDuplicate.current === duplicate.key) return
    handledDuplicate.current = duplicate.key
    onDuplicateHandled?.()
    insertDuplicate(duplicate)
  }, [duplicate?.key])

  const uploadAnnotations = useAnnotationsUpload({
    projectName,
    onSuccess: handleFileUploaded,
    onProgress: handleFileProgress,
    // seed progress so the card switches to uploading before the export finishes
    onStart: (annotation) =>
      handleFileProgress({ loaded: 1, total: 100 }, { name: annotation.name, type: 'image/png' }),
    onError: (annotation) => removeFileUploading(annotation.name),
  })

  const isUploading = filesUploading.length > 0 || inlineUploads > 0
  const isSaving = isSubmitting || isUploading

  const handleSubmit = async () => {
    if (isSaving) return
    try {
      setIsSubmitting(true)

      // upload any annotations first
      let annotationFiles = []
      let newAnnotations = uploadedAnnotations
      if (annotations.length) {
        const { files, metadata } = await uploadAnnotations(annotations)
        annotationFiles = files
        newAnnotations = [...newAnnotations, ...metadata]
      }

      // get current files data and merge it with the new metadata
      const { annotations: annotationsData = [] } = data || {}
      const annotationMetadata: SavedAnnotationMetadata[] | undefined = newAnnotations.length
        ? [...annotationsData, ...newAnnotations]
        : undefined

      // remove img query params
      const markdown = parseImages(editorRef.current?.getMarkdown() ?? editorValue)

      // files of removed image / video blocks aren't part of the comment anymore
      const keptFiles = files.filter((file) => !file.isInline || isReferenced(file.id, markdown))
      const uploadedFiles = [...keptFiles, ...annotationFiles]

      const newData = {
        ...data,
        annotations: annotationMetadata, // could be undefined
        category: isGuest ? null : category, // guests cannot set category (it is done by default on backend)
        // one frame link per comment, stored as metadata rather than in the text
        ...(frameLink && { startFrame: frameLink.startFrame, endFrame: frameLink.endFrame }),
      }

      if ((markdown || uploadedFiles.length) && onSubmit) {
        const submittedValue = editorValue
        // clear before the optimistic comment renders, otherwise both show the same files
        setEditorValue('')
        setFiles([])
        try {
          await onSubmit(markdown, uploadedFiles, newData)
          setUploadedAnnotations([])
          // the link now belongs to the submitted comment
          if (frameLink) commentFrameLink?.unlink()
        } catch (error) {
          // error is handled in rtk query mutation
          setEditorValue(submittedValue)
          setFiles(uploadedFiles)
          setUploadedAnnotations(newAnnotations)
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

  const allFiles = [
    ...annotations,
    ...(files || []).filter((file: any) => !file.isAnnotationLayer && !file.isInline),
    ...filesUploading,
  ].sort((a, b) => a.order - b.order)
  const compactGrid = allFiles.length > 3

  const getCommentPlaceholder = (isOpen?: boolean) => {
    if (disabled) {
      if (isGuest) return 'You do not have permission to comment.'
      return 'Commenting is disabled across multiple projects.'
    }

    if (isGuest || !isOpen) return 'Leave a comment'

    return 'Comment, or type / to add mentions, checklists, code and more...'
  }

  const handleReviewSubmit = async (status: VersionReviewFeedback) => {
    if (!onReview) return
    try {
      const postComment = hasText || files.length > 0 || annotations.length > 0
      // if the editor value is valid, also submit the comment first
      if (postComment) {
        await handleSubmit()
      }

      onReview(status)
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong while submitting the review')
    }
  }

  const versionReviewButtons = versionReview && onReview && !disabled && (
    <Styled.VersionReviewButtons className={clsx('version-review-buttons', { guest: isGuest })}>
      <Styled.VersionReviewButton
        icon="check"
        variant="tertiary"
        data-tooltip="Approve"
        onClick={() => handleReviewSubmit(VersionReviewFeedback.APPROVE)}
      >
        <span className="label">Approve</span>
      </Styled.VersionReviewButton>
      <Styled.VersionReviewButton
        icon="refresh"
        variant="danger"
        data-tooltip="Request changes"
        onClick={() => handleReviewSubmit(VersionReviewFeedback.REQUEST_CHANGES)}
      >
        <span className="label">Request changes</span>
      </Styled.VersionReviewButton>
    </Styled.VersionReviewButtons>
  )

  const categorySelect = !isGuest && (
    <ActivityCategorySelect
      value={category}
      categories={categoryOptions}
      onChange={(c) => setCategory(c)}
      isCompact={isEditing}
      hasPowerpack={hasLicense}
      onPowerFeature={onPowerFeature}
      isHidden={isCategoryHidden(categoryOptions, { isGuest, isAdmin })}
    />
  )

  const attachButton = (
    <>
      <Button
        icon="attach_file"
        variant="text"
        className="md-toolbar-button"
        data-tooltip="Attach files"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          uploadFiles(Array.from(e.target.files || []))
          e.target.value = ''
        }}
      />
    </>
  )

  // don't take focus from an annotation that opened the input
  const autoFocus = !(annotations.length > 0 && files.length === 0)

  return (
    <>
      <Styled.AutoHeight
        // the mention picker spans the whole input, above it
        className={clsx('comment-container', 'md-mention-anchor', { isOpen, isEditing })}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDropping(false)}
        onDrop={handleDrop}
        onClick={() => setIsDropping(false)}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {versionReview && lastOwnVersionReview && (
          <VersionReviewPill lastOwnVersionReview={lastOwnVersionReview} />
        )}

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
          onClick={handleOpenClick}
          $categoryPrimary={categoryData?.color}
          $categoryTertiary={blendedCategoryColor.primary}
          $categorySecondary={blendedCategoryColor.secondary}
        >
          {/* file uploads */}
          {isOpen && (
            <FilesGrid
              files={allFiles}
              isCompact={compactGrid || isEditing}
              onRemove={handleFileRemove}
              projectName={projectName}
              onAnnotationClick={goToAnnotation}
              style={{
                borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                height: '100%',
              }}
              isEditing
              pt={{
                file: {
                  style: {
                    height: isEditing ? 70 : undefined,
                  },
                },
              }}
            />
          )}
          {isOpen && !disabled ? (
            <>
              {/* editing has no toolbar (formatting is on the selection), the category goes on top */}
              {isEditing && categorySelect && (
                <Styled.EditingCategory>{categorySelect}</Styled.EditingCategory>
              )}
              <MarkdownEditor
                ref={editorRef}
                className="comment-editor"
                value={editorValue}
                onChange={setEditorValue}
                placeholder={getCommentPlaceholder(true)}
                mentions={mentions}
                // an edited comment sits in the feed, open the menus at the caret (above if needed)
                mentionPlacement={isEditing ? 'inline' : 'top'}
                onMentionClick={handleMentionClick}
                onMentionHover={handleMentionHover}
                onSubmit={handleSubmit}
                onEscape={handleClose}
                onFiles={uploadFiles}
                onUploadMedia={uploadMedia}
                commands={frameLinkCommands}
                toolbar={!isEditing}
                floatingToolbar={isEditing}
                toolbarStart={categorySelect}
                toolbarEnd={
                  <>
                    <Styled.ToolbarDivider />
                    {attachButton}
                  </>
                }
                bordered={false}
                autoFocus={autoFocus}
                minHeight={isEditing ? 40 : 88}
                maxHeight={259}
              />
            </>
          ) : (
            <Styled.Placeholder>{getCommentPlaceholder()}</Styled.Placeholder>
          )}

          <Styled.Footer>
            {(!isGuest || showFrameLink) && (
              <Styled.Buttons>
                {!isGuest &&
                  MENTION_BUTTONS.map(({ trigger, icon, tooltip }) => (
                    <Button
                      key={trigger}
                      icon={icon}
                      variant="text"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editorRef.current?.insertMentionTrigger(trigger)}
                      data-tooltip={tooltip}
                      data-shortcut={trigger}
                    />
                  ))}
                {showFrameLink && (
                  // link the comment to the current frame, or remove the link
                  <Styled.FrameLinkButton
                    className="frame-link"
                    icon="timer"
                    variant="text"
                    selected={!!frameLink}
                    label={frameLinkLabel}
                    onClick={handleFrameLinkButton}
                    data-tooltip={frameLink ? 'Remove frame link' : 'Link to current frame'}
                    data-testid="comment-frame-link"
                  />
                )}
              </Styled.Buttons>
            )}
            <Styled.SubmitButtons>
              {isEditing && (
                <Button variant="text" onClick={handleClose}>
                  Cancel
                </Button>
              )}
              <SaveButton
                label={isEditing ? 'Save' : 'Comment'}
                className="comment"
                active={hasText || !!files.length}
                onClick={handleSubmit}
                disabled={isLoading || isSaving}
                saving={isSaving}
              />
            </Styled.SubmitButtons>
          </Styled.Footer>

          <Styled.Dropzone className={clsx({ show: isDropping && isOpen })}>
            <Icon icon="cloud_upload" />
          </Styled.Dropzone>
        </Styled.Comment>

        <Styled.VersionReviewButtonsSpacer />
        {versionReviewButtons}
      </Styled.AutoHeight>
    </>
  )
}

export default CommentInput
