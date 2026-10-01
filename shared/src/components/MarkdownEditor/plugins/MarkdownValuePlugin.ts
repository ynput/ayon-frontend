import { useEffect, useImperativeHandle, useRef, type ForwardedRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, CLEAR_HISTORY_COMMAND } from 'lexical'
import { $getMarkdown, $isEditorEmpty, $setMarkdown } from '../markdown/convert'
import { INSERT_MENTION_TRIGGER_COMMAND } from './MentionsPlugin'
import type { MarkdownEditorHandle } from '../types'

interface MarkdownValuePluginProps {
  value?: string
  onChange?: (markdown: string) => void
  handleRef?: ForwardedRef<MarkdownEditorHandle>
}

/**
 * Keeps the editor in sync with a markdown `value`:
 * - edits call `onChange` with the new markdown
 * - a `value` that differs from the last emitted markdown replaces the content (e.g. reset to '')
 */
const MarkdownValuePlugin = ({ value, onChange, handleRef }: MarkdownValuePluginProps) => {
  const [editor] = useLexicalComposerContext()
  // the initial value is imported through the composer's initial editor state
  const lastMarkdown = useRef<string | undefined>(value)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves, tags }) => {
        if (tags.has('markdown-value')) return
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return
        const markdown = editorState.read(() => $getMarkdown())
        if (markdown === lastMarkdown.current) return
        lastMarkdown.current = markdown
        onChangeRef.current?.(markdown)
      }),
    [editor],
  )

  useEffect(() => {
    if (value === undefined || value === lastMarkdown.current) return
    lastMarkdown.current = value
    editor.update(() => $setMarkdown(value), { tag: 'markdown-value' })
    // an externally set value is a new document, don't undo back into the old one
    editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
  }, [editor, value])

  useImperativeHandle(
    handleRef,
    () => ({
      getEditor: () => editor,
      focus: () => editor.focus(),
      blur: () => editor.blur(),
      getMarkdown: () => editor.getEditorState().read(() => $getMarkdown()),
      setMarkdown: (markdown: string) => {
        editor.update(() => $setMarkdown(markdown))
      },
      clear: () => {
        editor.update(() => $getRoot().clear())
      },
      isEmpty: () => editor.getEditorState().read(() => $isEditorEmpty()),
      insertMentionTrigger: (trigger) => {
        editor.focus(() => editor.dispatchCommand(INSERT_MENTION_TRIGGER_COMMAND, trigger))
      },
    }),
    [editor],
  )

  return null
}

export default MarkdownValuePlugin
