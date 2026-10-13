import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isRootNode,
  COMMAND_PRIORITY_LOW,
  INSERT_PARAGRAPH_COMMAND,
  type LexicalNode,
} from 'lexical'

const $isEmptyParagraph = (node: LexicalNode | null) =>
  $isParagraphNode(node) && node.getChildrenSize() === 0

/**
 * An empty line between paragraphs is a paragraph break in markdown and more than one can't be
 * stored. Stop enter from adding a second empty line in a row (like the empty line above the
 * caret). Anything that still slips through (e.g. paste) is collapsed when exporting.
 */
const EmptyParagraphPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(
    () =>
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        () => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false
          const block = selection.anchor.getNode().getTopLevelElement()
          if (!$isParagraphNode(block) || !$isRootNode(block.getParent())) return false

          const anchor = selection.anchor.getNode()
          const isAtStart =
            block.getChildrenSize() === 0 ||
            (selection.anchor.offset === 0 &&
              (anchor.is(block) || !!block.getFirstDescendant()?.is(anchor)))
          // a new empty line would end up next to the empty line above
          if (isAtStart && $isEmptyParagraph(block.getPreviousSibling())) return true
          // enter on an empty line right above another empty line
          if ($isEmptyParagraph(block) && $isEmptyParagraph(block.getNextSibling())) return true
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    [editor],
  )

  return null
}

export default EmptyParagraphPlugin
