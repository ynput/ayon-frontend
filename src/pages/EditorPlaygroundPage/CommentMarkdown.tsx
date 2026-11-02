import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import emoji from 'remark-emoji'
import remarkDirective from 'remark-directive'
import remarkDirectiveRehype from 'remark-directive-rehype'
import {
  aTag,
  blockquoteTag,
  codeTag,
  inputTag,
} from '@shared/containers/Feed/components/ActivityComment/ActivityMarkdownComponents'
import remarkLiteralDirectives from '@shared/containers/Feed/components/ActivityComment/remarkLiteralDirectives'
import { renderMediaParagraph, renderYouTubeParagraph } from '@shared/components/MarkdownEditor'
import { Body as CommentBody } from '@shared/containers/Feed/components/ActivityComment/ActivityComment.styled'
import * as Styled from './EditorPlaygroundPage.styled'

interface CommentMarkdownProps {
  markdown: string
  // GitHub like spacing between markdown paragraphs (the comment feed currently has none)
  spaced?: boolean
  onReferenceClick?: (ref: { entityType: string; entityId: string }) => void
  className?: string
}

// Renders markdown the same way a comment in the activity feed does
const CommentMarkdown = ({
  markdown,
  spaced,
  onReferenceClick,
  className,
}: CommentMarkdownProps) => (
  <Styled.Preview className={clsx(className, { spaced })}>
    <CommentBody>
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          emoji,
          remarkDirective,
          remarkLiteralDirectives,
          remarkDirectiveRehype,
        ]}
        urlTransform={(url) => url}
        components={{
          // @ts-ignore
          a: (props) =>
            // @ts-ignore
            aTag(props, {
              userName: 'luke',
              projectName: 'demo',
              activityId: 'playground',
              onReferenceClick: (ref) => onReferenceClick?.(ref),
              onReferenceTooltip: () => {},
            }),
          // @ts-ignore
          input: (props) => inputTag(props, { activity: {} }),
          // @ts-ignore
          code: (props) => codeTag(props),
          // @ts-ignore
          blockquote: (props) => blockquoteTag(props),
          // @ts-ignore
          p: (props) =>
            renderMediaParagraph(props) ?? renderYouTubeParagraph(props) ?? <p>{props.children}</p>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </CommentBody>
  </Styled.Preview>
)

export default CommentMarkdown
