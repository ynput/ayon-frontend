import React, { useState } from 'react'
import * as Styled from './ActivityComment.styled'
import ActivityHeader from '../ActivityHeader/ActivityHeader'
import ReactMarkdown from 'react-markdown'
import CommentWrapper from './CommentWrapper'
import remarkGfm from 'remark-gfm'
import emoji from 'remark-emoji'
import { classNames } from 'primereact/utils'
import { useSelector } from 'react-redux'
import CommentInput from '@components/CommentInput/CommentInput'
import { aTag, codeTag, inputTag } from './activityMarkdownComponents'
import FilesGrid from '@/containers/FilesGrid/FilesGrid'
import useReferenceTooltip from '@/containers/Feed/hooks/useReferenceTooltip'
import { getTextRefs } from '../../CommentInput/quillToMarkdown'

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
  isHighlighted,
  dispatch,
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
    origin,
  } = activity
  if (!authorName) authorName = author?.name || ''
  if (!authorFullName) authorFullName = author?.fullName || authorName
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

  const isRef = referenceType !== 'origin' || showOrigin

  const handleDelete = () => {
    const refs = getTextRefs(body)

    // if the comment is a reference, (it's origin is not the entity)
    // we need to delete the reference from the origin as well
    // add it to the refs to delete
    if (isRef && origin) {
      refs.push({ id: origin.id, type: origin.type })
    }

    // note: body is used to match other refs to delete
    onDelete && onDelete(activityId, entityId, refs, body)
  }

  const [, setRefTooltip] = useReferenceTooltip({ dispatch })

  return (
    <>
      <Styled.Comment
        className={classNames('comment', { isOwner, isMenuOpen, isEditing, isHighlighted })}
      >
        <ActivityHeader
          id={menuId}
          name={authorName}
          fullName={authorFullName}
          date={createdAt}
          isRef={isRef}
          activity={activity}
          onDelete={handleDelete}
          onEdit={handleEditComment}
          projectInfo={projectInfo}
          projectName={projectName}
          entityType={entityType}
          onReferenceClick={onReferenceClick}
          onReferenceTooltip={setRefTooltip}
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
                  remarkPlugins={[remarkGfm, emoji]}
                  urlTransform={(url) => url}
                  components={{
                    // a links
                    a: (props) =>
                      aTag(props, {
                        entityId,
                        projectName,
                        projectInfo,
                        onReferenceClick,
                        onReferenceTooltip: setRefTooltip,
                        activityId,
                      }),
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
    </>
  )
}

export default ActivityComment
