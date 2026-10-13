import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createLinkNode, $isLinkNode } from '@lexical/link'
import { $findMatchingParent } from '@lexical/utils'
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_NORMAL,
  PASTE_COMMAND,
} from 'lexical'
import { getLinkLabel } from '../links/getLinkLabel'
import { $isSelectionInCode } from './selectionHelpers'

/**
 * A pasted link to a well known site (github, jira, linear, figma...) gets a short label made
 * from its url, e.g. `ayon-frontend #2342`. Pasting over a selection still links the selection,
 * and a pasted url in code stays text.
 */
const LinkPastePlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(
    () =>
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          if (!(event instanceof ClipboardEvent) || !event.clipboardData) return false
          const url = event.clipboardData.getData('text/plain').trim()
          if (!url || /\s/.test(url)) return false
          const label = getLinkLabel(url)
          if (!label) return false

          const selection = $getSelection()
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false
          if ($isSelectionInCode()) return false
          if ($findMatchingParent(selection.anchor.getNode(), $isLinkNode)) return false

          event.preventDefault()
          selection.insertNodes([$createLinkNode(url).append($createTextNode(label))])
          return true
        },
        // after the youtube embed paste (registered first), before the rich text paste
        COMMAND_PRIORITY_NORMAL,
      ),
    [editor],
  )

  return null
}

export default LinkPastePlugin
