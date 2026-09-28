import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isRootNode,
  COMMAND_PRIORITY_NORMAL,
  KEY_ENTER_COMMAND,
  PASTE_COMMAND,
  type ElementNode,
} from 'lexical'
import { $createYouTubeNode } from '../nodes/YouTubeNode'
import { parseYouTubeUrl } from '../youtube/parseYouTubeUrl'

// the top level paragraph with the caret
const $getCaretParagraph = (): ElementNode | null => {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null
  const block = selection.anchor.getNode().getTopLevelElement()
  return $isParagraphNode(block) && $isRootNode(block.getParent()) ? block : null
}

// replace the paragraph with the video and continue writing below it
const $embedVideo = (paragraph: ElementNode, url: string) => {
  const video = $createYouTubeNode(url)
  paragraph.replace(video)
  const next = video.getNextSibling()
  if ($isParagraphNode(next) && next.getChildrenSize() === 0) {
    next.select()
  } else {
    const empty = $createParagraphNode()
    video.insertAfter(empty)
    empty.select()
  }
}

// Insert a video at the caret: on an empty line it takes the line, otherwise it goes below the block
export const $insertYouTubeVideo = (url: string) => {
  const paragraph = $getCaretParagraph()
  if (paragraph && paragraph.getTextContent().trim() === '') {
    $embedVideo(paragraph, url)
    return
  }
  const selection = $getSelection()
  const block = $isRangeSelection(selection)
    ? selection.anchor.getNode().getTopLevelElement()
    : $getRoot().getLastChild()
  const video = $createYouTubeNode(url)
  if (block) block.insertAfter(video)
  else $getRoot().append(video)
  const empty = $createParagraphNode()
  video.insertAfter(empty)
  empty.select()
}

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
            $embedVideo(paragraph, text)
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
            $embedVideo(paragraph, text)
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
