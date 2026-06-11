import { FC, ReactNode } from 'react'
import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'
import { type EntityComment } from '@shared/api'
import { getFuzzyDate } from '@shared/containers/Feed/components/ActivityDate'
import { WidgetBaseProps } from './CellWidget'

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  max-height: 100%;
  overflow: hidden;
`

const CommentRow = styled.div`
  min-width: 0;
  line-height: 20px;
  overflow-wrap: anywhere;

  .meta {
    color: var(--md-sys-color-outline);
    margin-right: 6px;
    white-space: nowrap;
    ${theme.bodySmall}
  }
`

const Mention = styled.span`
  color: var(--md-sys-color-primary);
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  padding: 0 4px;
`

const markdownToPlainText = (body: string) =>
  body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> label
    .replace(/\[[ xX]\]/g, '') // checklist markers
    .replace(/&#\d+;|&[a-zA-Z]+;/g, ' ') // html entities
    .replace(/[`*_~#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const MENTION_REGEX = /\[([^\]]+)\]\((user|team|task|folder|version|product):[^)]+\)/g

// mentions become styled chips, everything else plain text
const renderBody = (body: string): ReactNode[] => {
  const nodes: ReactNode[] = []
  const regex = new RegExp(MENTION_REGEX)
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(body))) {
    const before = markdownToPlainText(body.slice(lastIndex, match.index))
    if (before) nodes.push(before + ' ')
    nodes.push(<Mention key={match.index}>@{match[1]}</Mention>)
    lastIndex = regex.lastIndex
  }
  const rest = markdownToPlainText(body.slice(lastIndex))
  if (rest) nodes.push(' ' + rest)

  return nodes
}

export interface CommentsWidgetProps extends WidgetBaseProps {
  value?: EntityComment[]
}

export const CommentsWidget: FC<CommentsWidgetProps> = ({ value }) => {
  const comments = value || []
  if (!comments.length) return null

  return (
    <CommentsList className="comments-list">
      {comments.map((comment) => (
        <CommentRow key={comment.activityId}>
          <span className="meta">
            {comment.author} · {getFuzzyDate(new Date(comment.createdAt))}
          </span>
          {renderBody(comment.body)}
        </CommentRow>
      ))}
    </CommentsList>
  )
}
