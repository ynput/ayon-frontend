import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getClipboardDataFromSelection, copyToClipboard } from '@lexical/clipboard'
import { $convertSelectionToMarkdownString } from '@lexical/markdown'
import { DRAG_DROP_PASTE } from '@lexical/rich-text'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  COPY_COMMAND,
  CUT_COMMAND,
  PASTE_COMMAND,
  type LexicalNode,
} from 'lexical'
import { $isMentionNode } from '../nodes/MentionNode'
import { MARKDOWN_TRANSFORMERS } from '../markdown/transformers'
import { $markdownToNodes } from '../markdown/convert'
import { MENTION_REF_TYPES } from '../types'

const MENTION_MARKDOWN_REGEX = new RegExp(
  `\\[[^\\]\\n]+\\]\\(@?(${MENTION_REF_TYPES.join('|')}):[^)\\s]+\\)`,
)

interface ClipboardPluginProps {
  // files pasted or dropped into the editor
  onFiles?: (files: File[]) => void
}

/**
 * - Copying a selection with mentions puts markdown on the plain text clipboard, so mentions
 *   survive being pasted back into any editor (or a comment)
 * - Pasting plain text with `[label](type:id)` turns it back into mentions
 * - Pasted / dropped files are handed to `onFiles`
 */
const ClipboardPlugin = ({ onFiles }: ClipboardPluginProps) => {
  const [editor] = useLexicalComposerContext()
  const onFilesRef = useRef(onFiles)
  onFilesRef.current = onFiles

  useEffect(() => {
    const $copyWithMarkdown = (event: ClipboardEvent | KeyboardEvent | null) => {
      if (!(event instanceof ClipboardEvent)) return false
      const selection = $getSelection()
      if (!$isRangeSelection(selection) || selection.isCollapsed()) return false
      if (!selection.getNodes().some($isMentionNode)) return false

      const data = $getClipboardDataFromSelection(selection)
      data['text/plain'] = $convertSelectionToMarkdownString(MARKDOWN_TRANSFORMERS, selection)
      copyToClipboard(editor, event, data)
      return true
    }

    return mergeRegister(
      editor.registerCommand(COPY_COMMAND, $copyWithMarkdown, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        CUT_COMMAND,
        (event) => {
          if (!$copyWithMarkdown(event)) return false
          const selection = $getSelection()
          if ($isRangeSelection(selection)) selection.removeText()
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          if (!(event instanceof ClipboardEvent) || !event.clipboardData) return false
          const { clipboardData } = event
          // lexical content and html pastes are handled by the rich text plugin (mentions are
          // parsed from html by MentionNode.importDOM)
          if (clipboardData.types.includes('application/x-lexical-editor')) return false
          if (clipboardData.types.includes('text/html')) return false
          const text = clipboardData.getData('text/plain')
          if (!text || !MENTION_MARKDOWN_REGEX.test(text)) return false

          const selection = $getSelection()
          if (!$isRangeSelection(selection)) return false
          event.preventDefault()
          const nodes = $markdownToNodes(text)
          // a single paragraph is pasted inline into the current block
          const toInsert: LexicalNode[] =
            nodes.length === 1 && $isParagraphNode(nodes[0]) ? nodes[0].getChildren() : nodes
          selection.insertNodes(toInsert)
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DRAG_DROP_PASTE,
        (files) => {
          if (!onFilesRef.current || !files.length) return false
          onFilesRef.current(files)
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor])

  return null
}

export default ClipboardPlugin
