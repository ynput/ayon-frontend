import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_DOWN_COMMAND,
} from 'lexical'

const isModifier = (e: KeyboardEvent) => e.metaKey || e.ctrlKey

/**
 * Makes inline `code` easy to get in and out of:
 * - mod+E toggles inline code
 * - at the edge of a code span the first arrow press moves the caret out of the code (typing
 *   continues as plain text) and the next one moves the caret as usual. Without this there is
 *   no way to stop typing code at the end of a line.
 */
const InlineCodePlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(
    () =>
      mergeRegister(
        editor.registerCommand(
          KEY_DOWN_COMMAND,
          (e) => {
            if (isModifier(e) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'e') {
              e.preventDefault()
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')
              return true
            }
            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          KEY_ARROW_RIGHT_COMMAND,
          (e) => {
            if (e?.shiftKey) return false
            const selection = $getSelection()
            if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false
            if (!selection.hasFormat('code')) return false
            const node = selection.anchor.getNode()
            if (!$isTextNode(node) || !node.hasFormat('code')) return false
            if (selection.anchor.offset !== node.getTextContentSize()) return false

            e?.preventDefault()
            const next = node.getNextSibling()
            if ($isTextNode(next) && !next.hasFormat('code') && next.isSimpleText()) {
              next.select(0, 0)
            } else {
              selection.toggleFormat('code')
            }
            return true
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          KEY_ARROW_LEFT_COMMAND,
          (e) => {
            if (e?.shiftKey) return false
            const selection = $getSelection()
            if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false
            if (!selection.hasFormat('code')) return false
            const node = selection.anchor.getNode()
            if (!$isTextNode(node) || !node.hasFormat('code')) return false
            if (selection.anchor.offset !== 0) return false

            e?.preventDefault()
            const prev = node.getPreviousSibling()
            if ($isTextNode(prev) && !prev.hasFormat('code') && prev.isSimpleText()) {
              const size = prev.getTextContentSize()
              prev.select(size, size)
            } else {
              selection.toggleFormat('code')
            }
            return true
          },
          COMMAND_PRIORITY_LOW,
        ),
      ),
    [editor],
  )

  return null
}

export default InlineCodePlugin
