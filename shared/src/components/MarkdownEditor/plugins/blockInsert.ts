import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isRootNode,
  type ElementNode,
  type LexicalNode,
} from 'lexical'

// the top level paragraph with the caret
export const $getCaretParagraph = (): ElementNode | null => {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null
  const block = selection.anchor.getNode().getTopLevelElement()
  return $isParagraphNode(block) && $isRootNode(block.getParent()) ? block : null
}

// continue writing on an empty line below a block
const $selectLineAfter = (block: LexicalNode) => {
  const next = block.getNextSibling()
  if ($isParagraphNode(next) && next.getChildrenSize() === 0) {
    next.select()
  } else {
    const empty = $createParagraphNode()
    block.insertAfter(empty)
    empty.select()
  }
}

// replace a paragraph with a block (video, image...)
export const $replaceWithBlock = (paragraph: ElementNode, block: LexicalNode) => {
  paragraph.replace(block)
  $selectLineAfter(block)
}

// Insert a block at the caret: on an empty line it takes the line, otherwise it goes below the block
export const $insertBlockAtCaret = (block: LexicalNode) => {
  const paragraph = $getCaretParagraph()
  if (paragraph && paragraph.getTextContent().trim() === '') {
    $replaceWithBlock(paragraph, block)
    return
  }
  const selection = $getSelection()
  const current = $isRangeSelection(selection)
    ? selection.anchor.getNode().getTopLevelElement()
    : $getRoot().getLastChild()
  if (current) current.insertAfter(block)
  else $getRoot().append(block)
  $selectLineAfter(block)
}
