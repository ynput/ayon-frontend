import { useEffect, useRef, useState } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { MarkdownEditor, type MarkdownEditorHandle } from '@shared/components/MarkdownEditor'
import UserImage from '@shared/components/UserImage'
import CommentMarkdown from './CommentMarkdown'
import { mockUploadMedia, useMockMentions } from './useMockMentions'
import { SEED_MESSAGES } from './samples'
import * as Styled from './EditorPlaygroundPage.styled'

interface Message {
  id: string
  author: string
  markdown: string
  // markdown shown under the message, to check what was sent
  showSource?: boolean
}

// Chat style feed with the message input at the bottom, like Discord
const MessagesDemo = () => {
  const editorRef = useRef<MarkdownEditorHandle>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES)
  const [showSource, setShowSource] = useState(false)
  const mentions = useMockMentions()

  // keep the newest message in view
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight })
  }, [messages.length])

  const send = () => {
    const markdown = editorRef.current?.getMarkdown() ?? draft
    if (!markdown.trim()) return
    setMessages((prev) => [...prev, { id: `${Date.now()}`, author: 'Luke Inderwick', markdown }])
    setDraft('')
  }

  return (
    <>
      <Styled.Header>
        <Styled.Hint>
          Enter sends, Shift+Enter adds a line, select text to format it. Mentions open above the
          input.
        </Styled.Hint>
        <Styled.Toggle>
          <input
            type="checkbox"
            checked={showSource}
            onChange={(e) => setShowSource(e.target.checked)}
          />
          Show markdown
        </Styled.Toggle>
      </Styled.Header>

      <Styled.Chat>
        <Styled.Feed ref={feedRef}>
          {messages.map((message) => (
            <Styled.Message key={message.id}>
              <UserImage size={32} name={message.author} />
              <div className="message-body">
                <span className="author">{message.author}</span>
                <CommentMarkdown markdown={message.markdown} spaced className="message-markdown" />
                {showSource && <Styled.MessageSource>{message.markdown}</Styled.MessageSource>}
              </div>
            </Styled.Message>
          ))}
        </Styled.Feed>

        <Styled.ChatInput>
          <MarkdownEditor
            ref={editorRef}
            variant="message"
            value={draft}
            onChange={setDraft}
            onSubmit={send}
            mentions={mentions}
            onUploadMedia={mockUploadMedia}
            placeholder="Message #sh160-compositing"
            actions={
              <>
                <Button
                  icon="alternate_email"
                  variant="text"
                  data-tooltip="Mention"
                  onClick={() => editorRef.current?.insertMentionTrigger('@')}
                />
                <Button
                  icon="send"
                  variant="text"
                  data-tooltip="Send"
                  disabled={!draft.trim()}
                  onClick={send}
                />
              </>
            }
          />
        </Styled.ChatInput>
      </Styled.Chat>
    </>
  )
}

export default MessagesDemo
