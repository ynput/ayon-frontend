import React from 'react'
import * as Styled from './ActivityCommentOrigin.styled'
import ActivityHeader from '../../ActivityHeader/ActivityHeader'
import ReactMarkdown from 'react-markdown'
import FeedReference from '../../ActivityReference/ActivityReference'
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

const ActivityCommentOrigin = ({ activity = {}, users, onCheckChange, onDelete }) => {
  const { body, authorName, createdAt, referenceType, activityId } = activity

  return (
    <Styled.Comment>
      <ActivityHeader
        name={authorName}
        users={users}
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
                  <FeedReference id={id} type={type} style={{ userSelect: 'text' }} label={label}>
                    {label}
                  </FeedReference>
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

export default ActivityCommentOrigin
