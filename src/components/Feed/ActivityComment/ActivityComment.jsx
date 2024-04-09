import React from 'react'
import * as Styled from './ActivityComment.styled'
import ActivityHeader from '../ActivityHeader/ActivityHeader'
import ReactMarkdown from 'react-markdown'
import FeedReference from '../FeedReference/FeedReference'
import CommentWrapper from './CommentWrapper'
import { Icon } from '@ynput/ayon-react-components'
import Typography from '/src/theme/typography.module.css'

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

const ActivityComment = ({ comment, users }) => {
  const body = comment.body

  // on double click, select all body text
  const handleDoubleClick = (e) => {
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(e.target)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  return (
    <Styled.Comment>
      <ActivityHeader name={comment.authorName} users={users} date={comment.createdAt} />
      <Styled.Body onDoubleClick={handleDoubleClick}>
        <CommentWrapper>
          <ReactMarkdown
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
                  <FeedReference
                    id={id}
                    type={type}
                    style={{ top: 5, userSelect: 'text' }}
                    label={label}
                  >
                    {label}
                  </FeedReference>
                )
              },
            }}
          >
            {body}
          </ReactMarkdown>
        </CommentWrapper>
        {!!comment.attachments?.length && (
          <Styled.Attachments>
            {comment.attachments.map(({ id, type, url, name }) =>
              type === 'image' ? (
                <Styled.AttachmentImg key={id} src={url} />
              ) : (
                <Styled.AttachmentFile key={id}>
                  <Icon icon="attach_file" />
                  <Styled.Name className={Typography.labelSmall}>{name}</Styled.Name>
                </Styled.AttachmentFile>
              ),
            )}
          </Styled.Attachments>
        )}
      </Styled.Body>
    </Styled.Comment>
  )
}

export default ActivityComment
