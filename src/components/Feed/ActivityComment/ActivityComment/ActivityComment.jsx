import React from 'react'
import * as Styled from './ActivityComment.styled'
import ActivityHeader from '../../ActivityHeader/ActivityHeader'
import ReactMarkdown from 'react-markdown'
import ActivityReference from '../../ActivityReference/ActivityReference'
import CommentWrapper from '../CommentWrapper'
import remarkGfm from 'remark-gfm'
import ActivityCheckbox from '../ActivityCheckbox/ActivityCheckbox'

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

const ActivityComment = ({ activity = {}, onCheckChange, onDelete }) => {
  let { body, authorName, authorFullName, createdAt, referenceType, activityId, author } = activity
  if (!authorName) authorName = author?.name || ''
  if (!authorFullName) authorFullName = author?.fullName || authorName || 'Unknown'

  return (
    <Styled.Comment>
      <ActivityHeader
        name={authorName}
        fullName={authorFullName || authorName}
        date={createdAt}
        isRef={referenceType !== 'origin'}
        activity={activity}
        onDelete={() => onDelete && onDelete(activityId)}
      />
      <Styled.Body className="comment-body">
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

                return (
                  <ActivityReference id={id} type={type} label={label} name={id}>
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
      </Styled.Body>
    </Styled.Comment>
  )
}

export default ActivityComment
