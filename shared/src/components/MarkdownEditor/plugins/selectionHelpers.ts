import { $isCodeNode } from '@lexical/code'
import { $findMatchingParent } from '@lexical/utils'
import { $getSelection, $isRangeSelection, $isTextNode } from 'lexical'

// Is the caret in inline code or a code block (where suggestions should not open)
export const $isSelectionInCode = () => {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return false
  if (selection.hasFormat('code')) return true
  const anchor = selection.anchor.getNode()
  if ($isTextNode(anchor) && anchor.hasFormat('code')) return true
  return !!$findMatchingParent(anchor, $isCodeNode)
}
