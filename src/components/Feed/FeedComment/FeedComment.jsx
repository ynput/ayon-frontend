import React from 'react'
import * as Styled from './FeedComment.styled'
import FeedHeader from '../FeedHeader/FeedHeader'
import ReactMarkdown from 'react-markdown'
import FeedReference from '../FeedReference/FeedReference'
import CommentWrapper from './CommentWrapper'

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

const countAtSymbolsBeforeLink = (body, link) => {
  const prefix = body.substring(0, body.indexOf(link))
  //   prefix last 3 characters
  const last3 = prefix.substring(prefix.length - 3)

  //   count @ in last 3 characters
  const atCount = (last3.match(/@/g) || []).length

  return atCount
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
    label: comment.entityName,
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
                const link = `[${children[0]}](${href})`
                //   get number of @ symbols before link
                const atCount = countAtSymbolsBeforeLink(body, link)
                if (atCount < 1) return <a href={href}>{children}</a>

                const type = getTypeByCount(atCount)

                // find the reference object by the href
                const reference = comment?.references?.find((ref) => ref.id === href)
                const label = reference?.label || children[0]

                const isSelf = comment?.reference?.refId === reference?.refId

                return (
                  <FeedReference
                    id={href}
                    type={type}
                    style={{ top: 5, userSelect: 'text' }}
                    variant={isSelf ? 'filled' : 'surface'}
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
      </Styled.Body>
    </Styled.Comment>
  )
}

export default FeedComment
