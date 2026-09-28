import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isCodeNode } from '@lexical/code'
import { $isListItemNode } from '@lexical/list'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isRootNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from 'lexical'

interface KeyboardPluginProps {
  onSubmit?: () => void
  onEscape?: () => void
  // enter submits (shift+enter for a new line), like a chat input
  submitOnEnter?: boolean
}

/**
 * - mod+enter submits
 * - with `submitOnEnter`, enter submits unless in a list or code block, where it adds a new line
 * - shift+enter in a paragraph starts a new line the same way enter does, so there is only one kind
 *   of line in paragraphs (see the paragraph model in markdown/convert.ts)
 * - escape (when no menu is open) calls onEscape
 */
const KeyboardPlugin = ({ onSubmit, onEscape, submitOnEnter }: KeyboardPluginProps) => {
  const [editor] = useLexicalComposerContext()
  const props = useRef({ onSubmit, onEscape, submitOnEnter })
  props.current = { onSubmit, onEscape, submitOnEnter }

  useEffect(() => {
    const $getBlockContext = () => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return null
      const anchor = selection.anchor.getNode()
      return {
        isInList: !!$findMatchingParent(anchor, $isListItemNode),
        isInCode: !!$findMatchingParent(anchor, $isCodeNode),
        isInParagraph: !!$findMatchingParent(
          anchor,
          (n) => $isParagraphNode(n) && $isRootNode(n.getParent()),
        ),
      }
    }

    return mergeRegister(
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (e) => {
          if (!e || !(e.metaKey || e.ctrlKey) || !props.current.onSubmit) return false
          e.preventDefault()
          props.current.onSubmit()
          return true
        },
        COMMAND_PRIORITY_HIGH,
      ),
      // below the mention menu (which selects an option on enter), above the rich text plugin
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (e) => {
          if (!e || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return false
          const context = $getBlockContext()
          if (!context) return false

          if (e.shiftKey) {
            if (!context.isInParagraph) return false
            e.preventDefault()
            return editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined)
          }

          const { submitOnEnter, onSubmit } = props.current
          if (!submitOnEnter || !onSubmit || context.isInList || context.isInCode) return false
          e.preventDefault()
          onSubmit()
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      // lowest priority so the mention menu and link editor can handle escape first
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (!props.current.onEscape) return false
          props.current.onEscape()
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor])

  return null
}

export default KeyboardPlugin
