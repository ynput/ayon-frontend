import { $createCodeNode, $isCodeNode } from '@lexical/code'
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
} from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils'
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical'

export type BlockType =
  | 'paragraph'
  | 'h2'
  | 'heading'
  | 'quote'
  | 'code'
  | 'bullet'
  | 'number'
  | 'check'

// blocks that can be toggled on and off
export type BlockFormat = Exclude<BlockType, 'paragraph' | 'heading'>

export const $getBlockType = (anchorNode: LexicalNode): BlockType => {
  let element =
    anchorNode.getKey() === 'root'
      ? anchorNode
      : $findMatchingParent(anchorNode, (e) => {
          const parent = e.getParent()
          return parent !== null && $isRootOrShadowRoot(parent)
        })
  if (element === null) element = anchorNode.getTopLevelElementOrThrow()

  if ($isListNode(element)) {
    const parentList = $getNearestNodeOfType(anchorNode, ListNode)
    return (parentList ?? element).getListType() as BlockType
  }
  if ($isHeadingNode(element)) return element.getTag() === 'h2' ? 'h2' : 'heading'
  if ($isQuoteNode(element)) return 'quote'
  if ($isCodeNode(element)) return 'code'
  return 'paragraph'
}

const LIST_COMMANDS = {
  bullet: INSERT_UNORDERED_LIST_COMMAND,
  number: INSERT_ORDERED_LIST_COMMAND,
  check: INSERT_CHECK_LIST_COMMAND,
} as const

/**
 * Turn the selected blocks into `format`, or back into paragraphs when they already are.
 * Used by the toolbar and keyboard shortcuts.
 */
export const toggleBlockFormat = (editor: LexicalEditor, format: BlockFormat) => {
  const current = editor.getEditorState().read(() => {
    const selection = $getSelection()
    return $isRangeSelection(selection) ? $getBlockType(selection.anchor.getNode()) : null
  })
  if (current === null) return

  if (format === 'bullet' || format === 'number' || format === 'check') {
    if (current === format) editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
    else editor.dispatchCommand(LIST_COMMANDS[format], undefined)
    return
  }

  editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    if (current === format) {
      $setBlocksType(selection, () => $createParagraphNode())
      return
    }
    if (format === 'h2') $setBlocksType(selection, () => $createHeadingNode('h2'))
    else if (format === 'quote') $setBlocksType(selection, () => $createQuoteNode())
    else if (selection.isCollapsed()) $setBlocksType(selection, () => $createCodeNode())
    else {
      // multiple lines become a single code block
      const text = selection.getTextContent()
      const codeNode = $createCodeNode()
      selection.insertNodes([codeNode])
      const newSelection = $getSelection()
      if ($isRangeSelection(newSelection)) newSelection.insertRawText(text)
    }
  })
}
