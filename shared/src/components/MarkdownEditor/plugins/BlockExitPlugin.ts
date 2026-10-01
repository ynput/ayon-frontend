import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isCodeNode } from '@lexical/code'
import { $isQuoteNode } from '@lexical/rich-text'
import { mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
} from 'lexical'

// When a code block or quote is the last block there is nowhere to put the caret after it.
// Pressing down/right at its end adds an empty paragraph to continue writing in.
const BlockExitPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const $exitLastBlock = (e: KeyboardEvent | null) => {
      if (e?.shiftKey) return false
      const selection = $getSelection()
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false
      const last = $getRoot().getLastChild()
      if (!last || !($isCodeNode(last) || $isQuoteNode(last))) return false
      const anchorNode = selection.anchor.getNode()
      const block = anchorNode.getTopLevelElement()
      if (!block || !block.is(last)) return false

      // caret must be at the very end of the block
      const lastDescendant = last.getLastDescendant()
      const isAtEnd =
        (anchorNode.is(last) && selection.anchor.offset === last.getChildrenSize()) ||
        (lastDescendant !== null &&
          anchorNode.is(lastDescendant) &&
          selection.anchor.offset === lastDescendant.getTextContentSize())
      if (!isAtEnd && last.getChildrenSize() > 0) return false

      e?.preventDefault()
      const paragraph = $createParagraphNode()
      last.insertAfter(paragraph)
      paragraph.select()
      return true
    }

    return mergeRegister(
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, $exitLastBlock, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, $exitLastBlock, COMMAND_PRIORITY_LOW),
    )
  }, [editor])

  return null
}

export default BlockExitPlugin
