import React, { useState } from 'react'
import * as Styled from './ActivityComment.styled'
import ActivityHeader from '../ActivityHeader/ActivityHeader'
import ReactMarkdown from 'react-markdown'
import ActivityReference from '../ActivityReference/ActivityReference'
import CommentWrapper from './CommentWrapper'
import remarkGfm from 'remark-gfm'
import ActivityCheckbox from '../ActivityCheckbox/ActivityCheckbox'
import { classNames } from 'primereact/utils'
import { useSelector } from 'react-redux'
import CommentInput from '/src/components/CommentInput/CommentInput'

const allowedRefTypes = [
  'user',
  'task',
  'folder',
  'version',
  'representation',
  'workfile',
  'product',
]
const sanitizeURL = (url = '') => {
  // ensure that the url is valid https url
  // or a valid {type}:{id} reference
  if (url.startsWith('https://')) return { url, type: 'url' }
  if (url.includes(':')) {
    const sections = url.split(':')
    const [type, id] = sections
    if (allowedRefTypes.includes(type) && id && sections.length === 2) return { type, id }
  }
  return {}
}

const ActivityComment = ({
  activity = {},
  onCheckChange,
  onDelete,
  onUpdate,
  projectInfo,
  editProps = {},
  projectName,
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
  } = activity
  if (!authorName) authorName = author?.name || ''
  if (!authorFullName) authorFullName = author?.fullName || authorName || 'Unknown'
  const menuId = 'comment-' + activity.activityId
  const isMenuOpen = useSelector((state) => state.context.menuOpen) === menuId
  // EDITING
  const [isEditing, setIsEditing] = useState(false)

  const handleEditComment = () => {
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  const handleSave = (value) => {
    setIsEditing(false)
    onUpdate(value)
  }

  return (
    <Styled.Comment className={classNames('comment', { isOwner, isMenuOpen, isEditing })}>
      <ActivityHeader
        id={menuId}
        name={authorName}
        fullName={authorFullName || authorName}
        date={createdAt}
        isRef={referenceType !== 'origin'}
        activity={activity}
        onDelete={() => onDelete && onDelete(activityId)}
        onEdit={handleEditComment}
        projectInfo={projectInfo}
        projectName={projectName}
      />
      <Styled.Body className={classNames('comment-body', { isEditing })}>
        {isEditing ? (
          <CommentInput
            isOpen={true}
            initValue={body}
            isEditing
            onClose={handleEditCancel}
            onSubmit={handleSave}
            projectInfo={projectInfo}
            {...editProps}
          />
        ) : (
          <CommentWrapper>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              urlTransform={(url) => url}
              components={{
                a: ({ children, href }) => {
                  const { url, type, id } = sanitizeURL(href)

                  // return regular url
                  if (url) <a href={href}>{children}</a>
                  // if no reference type, return regular link with no href
                  if (!type || !id) return <a>{children}</a>

                  const label = children && children.replace('@', '')
                  // is this ref the same as the current task id
                  const isEntity = id === entityId

                  return (
                    <ActivityReference
                      name={id}
                      {...{ type, id, label, projectName, projectInfo }}
                      variant={isEntity ? 'filled' : 'primary'}
                    >
                      {label}
                    </ActivityReference>
                  )
                },
                // checkbox inputs
                input: ({ type, checked, ...props }) => {
                  if (type === 'checkbox') {
                    return (
                      <ActivityCheckbox
                        checked={checked}
                        onChange={(e) => onCheckChange && onCheckChange(e, activity)}
                      />
                    )
                  } else {
                    return <input type={type} disabled {...props} />
                  }
                },
              }}
            >
              {body}
            </ReactMarkdown>
          </CommentWrapper>
        )}
      </Styled.Body>
    </Styled.Comment>
  )
}

export default ActivityComment
