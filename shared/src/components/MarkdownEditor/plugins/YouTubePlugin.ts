import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_NORMAL,
  KEY_ENTER_COMMAND,
  PASTE_COMMAND,
} from 'lexical'
import { $createYouTubeNode } from '../nodes/YouTubeNode'
import { parseYouTubeUrl } from '../youtube/parseYouTubeUrl'
import { $getCaretParagraph, $insertBlockAtCaret, $replaceWithBlock } from './blockInsert'

// Insert a video at the caret: on an empty line it takes the line, otherwise it goes below the block
export const $insertYouTubeVideo = (url: string) => $insertBlockAtCaret($createYouTubeNode(url))

/**
 * Embed YouTube videos: paste a video url on an empty line, or press enter after a line that is
 * only a video url. A url pasted into text stays a link.
 */
const YouTubePlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(
    () =>
      mergeRegister(
        editor.registerCommand(
          PASTE_COMMAND,
          (event) => {
            if (!(event instanceof ClipboardEvent) || !event.clipboardData) return false
            const text = event.clipboardData.getData('text/plain').trim()
            if (!text || /\s/.test(text) || !parseYouTubeUrl(text)) return false
            const paragraph = $getCaretParagraph()
            if (!paragraph || paragraph.getTextContent().trim() !== '') return false
            event.preventDefault()
            $replaceWithBlock(paragraph, $createYouTubeNode(text))
            return true
          },
          // before the rich text paste (and the markdown paste of mentions)
          COMMAND_PRIORITY_NORMAL,
        ),
        editor.registerCommand(
          KEY_ENTER_COMMAND,
          (event) => {
            if (event?.shiftKey || event?.metaKey || event?.ctrlKey) return false
            const paragraph = $getCaretParagraph()
            if (!paragraph) return false
            const text = paragraph.getTextContent().trim()
            if (!text || /\s/.test(text) || !parseYouTubeUrl(text)) return false
            const selection = $getSelection()
            // only with the caret at the end of the url
            if (!$isRangeSelection(selection)) return false
            // (the url is usually an auto link, so compare with the last text of the paragraph)
            const anchor = selection.anchor.getNode()
            const isAtEnd =
              !!paragraph.getLastDescendant()?.is(anchor) &&
              selection.anchor.offset === anchor.getTextContentSize()
            if (!isAtEnd) return false
            event?.preventDefault()
            $replaceWithBlock(paragraph, $createYouTubeNode(text))
            return true
          },
          // before enter to send in chat inputs
          COMMAND_PRIORITY_NORMAL,
        ),
      ),
    [editor],
  )

  return null
}

export default YouTubePlugin
