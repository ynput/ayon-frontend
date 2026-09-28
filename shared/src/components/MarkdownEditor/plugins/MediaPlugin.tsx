import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { DRAG_DROP_PASTE } from '@lexical/rich-text'
import { mergeRegister } from '@lexical/utils'
import {
  $getNodeByKey,
  BLUR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  SELECTION_CHANGE_COMMAND,
  createCommand,
  type LexicalCommand,
  type NodeKey,
} from 'lexical'
import { $createMediaNode, $isMediaNode } from '../nodes/MediaNode'
import { isMediaFile } from '../media/mediaUtils'
import { Icon } from '@ynput/ayon-react-components'
import { BLOCK_DIALOG_CLOSE_CLASS } from '@shared/components/LinksManager/CellEditingDialog'
import { $insertBlockAtCaret } from './blockInsert'
import * as Styled from '../MarkdownEditor.styled'

export interface UploadedMedia {
  // where the file is stored, e.g. /api/projects/{project}/files/{id}
  src: string
  name?: string
  mime?: string
}

export type UploadMedia = (file: File) => Promise<UploadedMedia>

// insert image / video files as blocks at the caret
export const INSERT_MEDIA_FILES_COMMAND: LexicalCommand<File[]> = createCommand(
  'INSERT_MEDIA_FILES_COMMAND',
)

// pick images / videos to insert (slash menu)
export const OPEN_MEDIA_PICKER_COMMAND: LexicalCommand<void> = createCommand(
  'OPEN_MEDIA_PICKER_COMMAND',
)

interface MediaPluginProps {
  onUploadMedia: UploadMedia
  // files that aren't images or videos (attachments)
  onFiles?: (files: File[]) => void
}

// pasted / dropped media that can be switched from attachments to inline blocks
interface PendingInline {
  files: File[]
  rect: { top: number; left: number }
}

const getCaretRect = (root: HTMLElement | null) => {
  const domSelection = window.getSelection()
  const range = domSelection?.rangeCount ? domSelection.getRangeAt(0) : null
  let rect = range?.getBoundingClientRect()
  if (!rect || (!rect.width && !rect.height)) {
    const node = range?.startContainer
    const element = node instanceof HTMLElement ? node : node?.parentElement
    rect = (element && root?.contains(element) ? element : root)?.getBoundingClientRect()
  }
  return rect ? { top: rect.bottom + 6, left: rect.left } : null
}

/**
 * Image and video blocks, inserted from the slash menu (file picker) with a local preview while
 * `onUploadMedia` stores them. Pasted and dropped files stay attachments (`onFiles`) like they
 * always were, with a prompt at the caret to show the images / videos inline instead: click it
 * or press tab. `onUploadMedia` is then called with the same File objects, so the caller can
 * reuse the attachment upload.
 */
const MediaPlugin = ({ onUploadMedia, onFiles }: MediaPluginProps) => {
  const [editor] = useLexicalComposerContext()
  const inputRef = useRef<HTMLInputElement>(null)
  const props = useRef({ onUploadMedia, onFiles })
  props.current = { onUploadMedia, onFiles }
  const [pending, setPending] = useState<PendingInline | null>(null)
  const pendingRef = useRef(pending)
  pendingRef.current = pending

  const insertFiles = useCallback(
    (files: File[]) => {
      for (const file of files) {
        const preview = URL.createObjectURL(file)
        let key: NodeKey | null = null
        editor.update(() => {
          const node = $createMediaNode({
            src: preview,
            alt: file.name,
            mime: file.type || null,
            uploading: true,
          })
          $insertBlockAtCaret(node)
          key = node.getKey()
        })

        props.current
          .onUploadMedia(file)
          .then(({ src, name, mime }) => {
            editor.update(() => {
              const node = key ? $getNodeByKey(key) : null
              if ($isMediaNode(node)) node.setUploaded(src, { alt: name, mime })
            })
          })
          .catch((error) => {
            // the caller reports the error, drop the block
            console.warn('Media upload failed', error)
            editor.update(() => {
              const node = key ? $getNodeByKey(key) : null
              if ($isMediaNode(node)) node.remove()
            })
          })
          .finally(() => URL.revokeObjectURL(preview))
      }
    },
    [editor],
  )

  const switchToInline = useCallback(() => {
    const current = pendingRef.current
    if (!current) return
    setPending(null)
    insertFiles(current.files)
    editor.focus()
  }, [editor, insertFiles])

  useEffect(() => {
    // the prompt goes away as soon as the user carries on
    const dismiss = () => {
      if (pendingRef.current) setPending(null)
      return false
    }

    return mergeRegister(
      editor.registerCommand(
        INSERT_MEDIA_FILES_COMMAND,
        (files) => {
          insertFiles(files)
          return true
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerCommand(
        OPEN_MEDIA_PICKER_COMMAND,
        () => {
          inputRef.current?.click()
          return true
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      // before the attachments handler: everything stays an attachment, media gets the prompt
      editor.registerCommand(
        DRAG_DROP_PASTE,
        (files) => {
          const media = files.filter(isMediaFile)
          if (!media.length || !props.current.onFiles) return false
          props.current.onFiles(files)
          const rect = getCaretRect(editor.getRootElement())
          if (rect) setPending({ files: media, rect })
          return true
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      // tab switches the pasted media to inline (before list indenting and menus)
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event) => {
          if (!pendingRef.current || event.shiftKey) return false
          event.preventDefault()
          switchToInline()
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (!pendingRef.current) return false
          setPending(null)
          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerTextContentListener(dismiss),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, dismiss, COMMAND_PRIORITY_LOW),
      editor.registerCommand(BLUR_COMMAND, dismiss, COMMAND_PRIORITY_LOW),
    )
  }, [editor, insertFiles, switchToInline])

  const count = pending?.files.length ?? 0
  const isVideo = !!pending?.files.every((file) => file.type.startsWith('video/'))

  return (
    <>
      {pending &&
        createPortal(
          <Styled.InlinePrompt
            className={clsx('md-popover md-inline-prompt', BLOCK_DIALOG_CLOSE_CLASS)}
            style={{ top: pending.rect.top, left: pending.rect.left }}
            type="button"
            // keep the editor focused, so tab and typing still work
            onMouseDown={(e) => e.preventDefault()}
            onClick={switchToInline}
          >
            <Icon icon={isVideo ? 'movie' : 'image'} />
            <span>Show {count > 1 ? `${count} files` : isVideo ? 'video' : 'image'} inline</span>
            <kbd>Tab</kbd>
          </Styled.InlinePrompt>,
          document.body,
        )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          if (files.length) editor.dispatchCommand(INSERT_MEDIA_FILES_COMMAND, files)
          e.target.value = ''
        }}
      />
    </>
  )
}

export default MediaPlugin
