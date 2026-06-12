import { FC, memo, ReactNode } from 'react'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Icon, theme } from '@ynput/ayon-react-components'
import { DoneCheckbox } from '@shared/components'
import { type EntityComment } from '@shared/api'
import { getFuzzyDate } from '@shared/containers/Feed/components/ActivityDate'
import { getEntityTypeIcon } from '@shared/util'
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

  code {
    background-color: var(--md-sys-color-surface-container-high);
    border-radius: var(--border-radius-m);
    padding: 0 2px;
    font-size: 0.85em;
  }
`

const Mention = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  vertical-align: bottom;
  color: var(--md-sys-color-primary);
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  padding: 0 4px 0 2px;

  .icon {
    font-size: 14px;
    color: var(--md-sys-color-primary);
  }
`

// matches allowedRefTypes in Feed's ActivityMarkdownComponents
const MENTION_TYPES = [
  'user',
  'team',
  'task',
  'folder',
  'version',
  'representation',
  'workfile',
  'product',
]

const mentionIcon = (type: string) =>
  type === 'user' ? 'alternate_email' : type === 'team' ? 'group' : getEntityTypeIcon(type, 'link')

// flatten block elements to inline spans so the comment flows as one wrapping line
const inline = ({ children }: { children?: ReactNode }) => <span>{children} </span>
// editor produces h2 only (header button); render headings bold to keep the hint
const heading = ({ children }: { children?: ReactNode }) => <strong>{children} </strong>

const markdownComponents = {
  p: inline,
  h1: heading,
  h2: heading,
  h3: heading,
  h4: heading,
  h5: heading,
  h6: heading,
  blockquote: inline,
  pre: inline,
  ul: inline,
  ol: inline,
  li: inline,
  br: () => <> </>,
  hr: () => null,
  img: () => null,
  input: ({ checked }: { checked?: boolean }) => (
    <DoneCheckbox
      checked={!!checked}
      isReadOnly
      style={{ fontSize: 16, verticalAlign: 'text-bottom', display: 'inline-block' }}
    />
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    const [type, id] = href?.split(':') ?? []
    if (type && id && MENTION_TYPES.includes(type)) {
      const label = String(children ?? '').replace('@', '')
      return (
        <Mention>
          <Icon icon={mentionIcon(type)} />
          {label}
        </Mention>
      )
    }
    return <span>{children}</span>
  },
}

const CommentBody = memo(({ body }: { body: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    urlTransform={(url) => url}
    components={markdownComponents}
  >
    {body}
  </ReactMarkdown>
))

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
          <CommentBody body={comment.body} />
        </CommentRow>
      ))}
    </CommentsList>
  )
}
