import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createListNode, $isListItemNode, $isListNode } from '@lexical/list'
import { TextNode } from 'lexical'

const CHECKBOX_PREFIX = /^\[([ xX]?)\]\s/

/**
 * Typing `- [ ] ` turns into a bullet item at `- `, so the markdown shortcut for check lists never
 * fires. Turn a bullet item that starts with `[ ] ` / `[x] ` into a check list item.
 */
const ChecklistShortcutPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(
    () =>
      editor.registerNodeTransform(TextNode, (node) => {
        if (!node.isSimpleText()) return
        const match = node.getTextContent().match(CHECKBOX_PREFIX)
        if (!match) return
        const item = node.getParent()
        if (!$isListItemNode(item) || !node.is(item.getFirstChild())) return
        const list = item.getParent()
        if (!$isListNode(list) || list.getListType() !== 'bullet') return

        if (list.getChildrenSize() === 1) {
          list.setListType('check')
        } else if (item.is(list.getLastChild())) {
          // start a new check list after the bullet list
          const checkList = $createListNode('check')
          list.insertAfter(checkList)
          checkList.append(item)
        } else {
          return
        }

        const offset = match[0].length
        node.spliceText(0, offset, '', true)
        item.setChecked(match[1].toLowerCase() === 'x')
      }),
    [editor],
  )

  return null
}

export default ChecklistShortcutPlugin
