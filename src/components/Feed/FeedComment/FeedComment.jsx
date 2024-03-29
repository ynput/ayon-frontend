import React from 'react'
import * as Styled from './FeedComment.styled'
import FeedHeader from '../FeedHeader/FeedHeader'
import ReactMarkdown from 'react-markdown'
import FeedReference from '../FeedReference/FeedReference'
import CommentWrapper from './CommentWrapper'
import { Icon } from '@ynput/ayon-react-components'
import Typography from '/src/theme/typography.module.css'

const getTypeByCount = (count) => {
  switch (count) {
    case 1:
      return 'user'

    case 2:
      return 'version'

    case 3:
      return 'task'

    default:
      return 'user'
  }
}

const countAtSymbolsBeforeLink = (link, body) => {
  const prefix = body.substring(0, body.indexOf(link.substring(1)))
  //   prefix last 3 characters
  const last2 = prefix.substring(prefix.length - 2)
  //   count @ in last 2 characters
  const atCount = (last2.match(/@/g) || []).length

  return atCount + 1
}

const FeedComment = ({ comment, users }) => {
  const body = comment.body

  // on double click, select all body text
  const handleDoubleClick = (e) => {
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(e.target)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const referenceSource = comment?.reference && {
    label: comment.entityFolder,
    refId: comment.entityId,
    refType: comment.entityType,
  }

  return (
    <Styled.Comment>
      <FeedHeader
        name={comment.author}
        users={users}
        date={comment.createdAt}
        reference={referenceSource}
      />
      <Styled.Body onDoubleClick={handleDoubleClick}>
        <CommentWrapper>
          <ReactMarkdown
            components={{
              a: ({ href, children }) => {
                if (!children[0] || !children[0].includes('@')) return <a href={href}>{children}</a>
                const link = `[${children[0]}](${href})`
                //   get number of @ symbols before link
                const atCount = countAtSymbolsBeforeLink(link, body)

                const type = getTypeByCount(atCount)

                // find the reference object by the href

                const label = children[0] && children[0].replace('@', '')
                const entityId = href

                return (
                  <FeedReference
                    id={entityId}
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

export default FeedComment
