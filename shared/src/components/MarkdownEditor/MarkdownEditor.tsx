import { forwardRef, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import clsx from 'clsx'
import { defineExtension } from 'lexical'
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { AutoLinkPlugin, createLinkMatcherWithRegExp } from '@lexical/react/LexicalAutoLinkPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { HeadingNode, QuoteNode, RichTextExtension } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { CodeHighlightNode, CodeNode } from '@lexical/code'

import { editorTheme } from './theme'
import { MentionNode } from './nodes/MentionNode'
import { YouTubeNode } from './nodes/YouTubeNode'
import { MediaNode } from './nodes/MediaNode'
import { MARKDOWN_TRANSFORMERS } from './markdown/transformers'
import { $setMarkdown } from './markdown/convert'
import MentionsPlugin from './plugins/MentionsPlugin'
import EmojiPlugin from './plugins/EmojiPlugin'
import MentionEventsPlugin from './plugins/MentionEventsPlugin'
import ToolbarPlugin from './plugins/ToolbarPlugin'
import InlineCodePlugin from './plugins/InlineCodePlugin'
import BlockExitPlugin from './plugins/BlockExitPlugin'
import ChecklistShortcutPlugin from './plugins/ChecklistShortcutPlugin'
import KeyboardPlugin from './plugins/KeyboardPlugin'
import EmptyParagraphPlugin from './plugins/EmptyParagraphPlugin'
import LinkClickPlugin from './plugins/LinkClickPlugin'
import LinkEditorPlugin from './plugins/LinkEditorPlugin'
import CodeLanguagePlugin from './plugins/CodeLanguagePlugin'
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin'
import YouTubePlugin from './plugins/YouTubePlugin'
import SlashCommandPlugin from './plugins/SlashCommandPlugin'
import LinkPastePlugin from './plugins/LinkPastePlugin'
import MediaPlugin, { type UploadMedia } from './plugins/MediaPlugin'
import ClipboardPlugin from './plugins/ClipboardPlugin'
import MarkdownValuePlugin from './plugins/MarkdownValuePlugin'
import type {
  EditorCommand,
  MarkdownEditorHandle,
  MentionEventHandlers,
  MentionPlacement,
  MentionSource,
  ToolbarLayout,
} from './types'
import { FLOATING_TOOLBAR } from './types'
import * as Styled from './MarkdownEditor.styled'

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/
const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/

const LINK_MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) =>
    text.startsWith('http') ? text : `https://${text}`,
  ),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => `mailto:${text}`),
]

const validateUrl = (url: string) => /^(https?:|mailto:|\/|#)/i.test(url)

const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  MentionNode,
  YouTubeNode,
  MediaNode,
]

// readOnly can change after the composer is created
const EditablePlugin = ({ editable }: { editable: boolean }) => {
  const [editor] = useLexicalComposerContext()
  useEffect(() => editor.setEditable(editable), [editor, editable])
  return null
}

export type MarkdownEditorVariant = 'document' | 'message'

// defaults of each variant, any of them can be overridden with props
const VARIANTS = {
  // descriptions, articles: toolbar at the top, enter adds a line
  document: {
    toolbar: true,
    floatingToolbar: false,
    submitOnEnter: false,
    mentionPlacement: 'inline',
    minHeight: 80,
    maxHeight: undefined,
  },
  // chat / comment input at the bottom of a feed: grows with the content, enter sends, formatting
  // from a toolbar over the selected text, mentions open above the input
  message: {
    toolbar: false,
    floatingToolbar: true,
    submitOnEnter: true,
    mentionPlacement: 'top',
    minHeight: 20,
    maxHeight: 400,
  },
} as const

export interface MarkdownEditorProps extends MentionEventHandlers {
  // document: description / article editor, message: chat style input
  variant?: MarkdownEditorVariant
  // markdown content, a value different from the last `onChange` replaces the content
  value?: string
  onChange?: (markdown: string) => void
  placeholder?: string
  // mod+enter
  onSubmit?: () => void
  // enter submits and shift+enter adds a line (default for the message variant)
  submitOnEnter?: boolean
  onEscape?: () => void
  // files pasted or dropped into the editor (attachments)
  onFiles?: (files: File[]) => void
  // store an image / video file and return its url, enables image and video blocks: pasted,
  // dropped or picked media become blocks instead of attachments
  onUploadMedia?: UploadMedia
  mentions?: MentionSource
  // DOM element the mention picker is rendered into
  mentionMenuParent?: HTMLElement
  // inline: at the caret, top: across the top of the editor (also used for the emoji picker)
  mentionPlacement?: MentionPlacement
  // type `:` and a shortcode to pick an emoji
  emoji?: boolean
  // type `/` to insert blocks, videos, attachments and mentions
  slashCommands?: boolean
  // extra `/` commands, shown first (memoize them, a new array rebuilds the menu)
  commands?: EditorCommand[]
  toolbar?: boolean | ToolbarLayout
  // formatting toolbar over the selected text
  floatingToolbar?: boolean | ToolbarLayout
  toolbarStart?: ReactNode
  toolbarEnd?: ReactNode
  // rendered under the content, e.g. attachments and a submit button
  footer?: ReactNode
  // rendered to the right of the content, e.g. buttons of a chat input
  actions?: ReactNode
  autoFocus?: boolean
  readOnly?: boolean
  bordered?: boolean
  minHeight?: number
  maxHeight?: number
  namespace?: string
  className?: string
  style?: CSSProperties
  contentClassName?: string
  // extra lexical plugins rendered inside the composer
  children?: ReactNode
}

/**
 * Rich text editor that reads and writes markdown.
 * Supports text formats, links, lists, check lists, quotes, inline code and code blocks and
 * mentions (`@user`, `@@version`, `@@@task`) stored as `[label](type:id)`.
 */
const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  (
    {
      variant = 'document',
      value,
      onChange,
      placeholder = 'Write something...',
      onSubmit,
      submitOnEnter = VARIANTS[variant].submitOnEnter,
      onEscape,
      onFiles,
      onUploadMedia,
      mentions,
      mentionMenuParent,
      mentionPlacement = VARIANTS[variant].mentionPlacement,
      emoji = true,
      slashCommands = true,
      commands,
      onMentionClick,
      onMentionHover,
      toolbar = VARIANTS[variant].toolbar,
      floatingToolbar = VARIANTS[variant].floatingToolbar,
      toolbarStart,
      toolbarEnd,
      footer,
      actions,
      autoFocus,
      readOnly,
      bordered = true,
      minHeight = VARIANTS[variant].minHeight,
      maxHeight = VARIANTS[variant].maxHeight,
      namespace = 'ayon-markdown-editor',
      className,
      style,
      contentClassName,
      children,
    },
    ref,
  ) => {
    // the editor is only configured once, later values go through MarkdownValuePlugin
    const extension = useMemo(
      () =>
        defineExtension({
          name: namespace,
          namespace,
          theme: editorTheme,
          nodes: EDITOR_NODES,
          editable: !readOnly,
          $initialEditorState: () => $setMarkdown(value || ''),
          // the react extension renders the decorator nodes (media, youtube)
          dependencies: [RichTextExtension],
          onError: (error) => {
            console.error('[MarkdownEditor]', error)
          },
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    )

    return (
      // the content editable is rendered below, inside the editor layout
      <LexicalExtensionComposer extension={extension} contentEditable={null}>
        <Styled.Container
          className={clsx('md-editor', 'block-shortcuts', `md-editor-${variant}`, className, {
            bordered,
            readOnly,
          })}
          style={style}
        >
          {toolbar && !readOnly && (
            <ToolbarPlugin
              layout={Array.isArray(toolbar) ? toolbar : undefined}
              start={toolbarStart}
              end={toolbarEnd}
            />
          )}
          <Styled.Body>
            <Styled.EditorScroller style={{ minHeight, maxHeight }}>
              <Styled.Content>
                <ContentEditable
                  className={clsx('md-content', contentClassName)}
                  style={{ minHeight }}
                  aria-placeholder={placeholder}
                  placeholder={
                    <Styled.Placeholder className="md-placeholder">
                      {placeholder}
                    </Styled.Placeholder>
                  }
                />
              </Styled.Content>
            </Styled.EditorScroller>
            {actions && <div className="md-actions">{actions}</div>}
          </Styled.Body>
          {footer}
        </Styled.Container>

        <EditablePlugin editable={!readOnly} />
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <TabIndentationPlugin maxIndent={5} />
        <LinkPlugin validateUrl={validateUrl} />
        <AutoLinkPlugin matchers={LINK_MATCHERS} />
        <LinkClickPlugin />
        {!readOnly && <LinkEditorPlugin />}
        {!readOnly && <CodeLanguagePlugin />}
        <CodeHighlightPlugin />
        {!readOnly && <YouTubePlugin />}
        {!readOnly && <LinkPastePlugin />}
        {onUploadMedia && !readOnly && (
          <MediaPlugin onUploadMedia={onUploadMedia} onFiles={onFiles} />
        )}
        <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
        <ChecklistShortcutPlugin />
        <InlineCodePlugin />
        <BlockExitPlugin />
        <EmptyParagraphPlugin />
        <KeyboardPlugin onSubmit={onSubmit} onEscape={onEscape} submitOnEnter={submitOnEnter} />
        {floatingToolbar && !readOnly && (
          <ToolbarPlugin
            floating
            layout={Array.isArray(floatingToolbar) ? floatingToolbar : FLOATING_TOOLBAR}
          />
        )}
        <ClipboardPlugin onFiles={onFiles} />
        <MarkdownValuePlugin value={value} onChange={onChange} handleRef={ref} />
        {slashCommands && !readOnly && (
          <SlashCommandPlugin
            placement={mentionPlacement}
            menuParent={mentionMenuParent}
            mentionTriggers={mentions ? mentions.triggers ?? ['@', '@@', '@@@'] : []}
            onFiles={onFiles}
            canInsertMedia={!!onUploadMedia}
            customCommands={commands}
          />
        )}
        {emoji && !readOnly && (
          <EmojiPlugin placement={mentionPlacement} menuParent={mentionMenuParent} />
        )}
        {mentions && (
          <MentionsPlugin
            source={mentions}
            menuParent={mentionMenuParent}
            placement={mentionPlacement}
          />
        )}
        {(onMentionClick || onMentionHover) && (
          <MentionEventsPlugin onMentionClick={onMentionClick} onMentionHover={onMentionHover} />
        )}
        {autoFocus && <AutoFocusPlugin defaultSelection="rootEnd" />}
        {children}
      </LexicalExtensionComposer>
    )
  },
)

MarkdownEditor.displayName = 'MarkdownEditor'

export default MarkdownEditor
