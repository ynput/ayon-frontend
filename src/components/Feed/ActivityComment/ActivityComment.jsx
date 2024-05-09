import React, { useState } from 'react'
import * as Styled from './ActivityComment.styled'
import ActivityHeader from '../ActivityHeader/ActivityHeader'
import ReactMarkdown from 'react-markdown'
import CommentWrapper from './CommentWrapper'
import remarkGfm from 'remark-gfm'
import { classNames } from 'primereact/utils'
import { useSelector } from 'react-redux'
import CommentInput from '/src/components/CommentInput/CommentInput'
import { aTag, codeTag, inputTag } from './activityMarkdownComponents'
import FilesGrid from '/src/containers/FilesGrid/FilesGrid'

const ActivityComment = ({
  activity = {},
  onCheckChange,
  onDelete,
  onUpdate,
  projectInfo,
  editProps = {},
  projectName,
  entityType,
  onReferenceClick,
  isSlideOut,
  onFileExpand,
  showOrigin,
}) => {
  let {
    body,
    authorName,
    authorFullName,
    createdAt,
    referenceType,
    entityId,
    activityId,
    author,
    isOwner,
    files = [],
  } = activity
  if (!authorName) authorName = author?.name || ''
  if (!authorFullName) authorFullName = author?.fullName || authorName || 'Unknown'
  let menuId = 'comment-' + activity.activityId
  if (isSlideOut) menuId += '-slideout'
  const isMenuOpen = useSelector((state) => state.context.menuOpen) === menuId
  // EDITING
  const [isEditing, setIsEditing] = useState(false)

  const handleEditComment = () => {
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  const handleSave = async (value, files) => {
    await onUpdate(value, files)
    // this won't run if the update fails
    setIsEditing(false)
  }

  return (
    <Styled.Comment className={classNames('comment', { isOwner, isMenuOpen, isEditing })}>
      <ActivityHeader
        id={menuId}
        name={authorName}
        fullName={authorFullName || authorName}
        date={createdAt}
        isRef={referenceType !== 'origin' || showOrigin}
        activity={activity}
        onDelete={() => onDelete && onDelete(activityId)}
        onEdit={handleEditComment}
        projectInfo={projectInfo}
        projectName={projectName}
        entityType={entityType}
        onReferenceClick={onReferenceClick}
      />
      <Styled.Body className={classNames('comment-body', { isEditing })}>
        {isEditing ? (
          <CommentInput
            isOpen={true}
            initValue={body}
            initFiles={files}
            isEditing
            onClose={handleEditCancel}
            onSubmit={handleSave}
            projectInfo={projectInfo}
            {...editProps}
          />
        ) : (
          <>
            <CommentWrapper>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                urlTransform={(url) => url}
                components={{
                  // a links
                  a: (props) =>
                    aTag(props, { entityId, projectName, projectInfo, onReferenceClick }),
                  // checkbox inputs
                  input: (props) => inputTag(props, { activity, onCheckChange }),
                  // code syntax highlighting
                  code: (props) => codeTag(props),
                }}
              >
                {body}
              </ReactMarkdown>
            </CommentWrapper>
            {/* file uploads */}
            <FilesGrid
              files={files}
              isCompact={files.length > 6}
              projectName={projectName}
              isDownloadable
              onExpand={onFileExpand}
            />
          </>
        )}
      </Styled.Body>
    </Styled.Comment>
  )
}

export default ActivityComment
