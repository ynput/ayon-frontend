import { FC, memo, ReactNode } from 'react'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Icon } from '@ynput/ayon-react-components'
import { DoneCheckbox, UserImage } from '@shared/components'
import { type EntityComment } from '@shared/api'
import { allowedRefTypes } from '@shared/containers/Feed/components/ActivityComment/ActivityMarkdownComponents'
import { getFuzzyDate } from '@shared/containers/Feed/components/ActivityDate'
import { getEntityTypeIcon } from '@shared/util'
import { WidgetBaseProps } from './CellWidget'

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  max-height: 100%;
  overflow: hidden;
`

const CommentRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
  line-height: 18px;

  .author {
    flex-shrink: 0;
    display: inline-flex;
  }

  /* preserve the comment's own line breaks (collapsing them makes feedback unreadable) */
  .body {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .body p,
  .body ul,
  .body ol,
  .body h1,
  .body h2,
  .body h3,
  .body h4,
  .body h5,
  .body h6 {
    margin: 0;
    font-size: 1em;
  }

  .body h1,
  .body h2,
  .body h3,
  .body h4,
  .body h5,
  .body h6 {
    font-weight: 700;
  }

  .body ul,
  .body ol {
    padding-left: 1.2em;
  }

  .body ul.contains-task-list,
  .body .task-list-item {
    padding-left: 0;
    list-style: none;
  }

  .body code {
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

const mentionIcon = (type: string) =>
  type === 'user' ? 'alternate_email' : type === 'team' ? 'group' : getEntityTypeIcon(type, 'link')

const markdownComponents = {
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
    if (type && id && allowedRefTypes.includes(type)) {
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

// Quill stores line breaks as literal <br>; react-markdown drops raw HTML, so
// turn them into CommonMark hard breaks (rendered natively, no raw-HTML plugin).
const normalizeBreaks = (body: string) => body.replace(/<br\s*\/?>/gi, '  \n')

const CommentBody = memo(({ body }: { body: string }) => (
  <div className="body">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={(url) => url}
      components={markdownComponents}
    >
      {normalizeBreaks(body)}
    </ReactMarkdown>
  </div>
))

const commentTooltip = (comment: EntityComment) => {
  const date = comment.createdAt ? getFuzzyDate(new Date(comment.createdAt)) : ''
  return [comment.author, date].filter(Boolean).join(' • ')
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
          <span className="author" data-tooltip={commentTooltip(comment)} data-tooltip-delay={0}>
            <UserImage name={comment.author || ''} size={18} />
          </span>
          <CommentBody body={comment.body} />
        </CommentRow>
      ))}
    </CommentsList>
  )
}
