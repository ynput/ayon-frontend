import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
  type LinkNode,
} from '@lexical/link'
import { $findMatchingParent, $unwrapNode, mergeRegister } from '@lexical/utils'
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  SELECTION_CHANGE_COMMAND,
  createCommand,
  type BaseSelection,
  type LexicalCommand,
  type NodeKey,
} from 'lexical'
import { Button, Icon } from '@ynput/ayon-react-components'
import { BLOCK_DIALOG_CLOSE_CLASS } from '@shared/components/LinksManager/CellEditingDialog'
import * as Styled from '../MarkdownEditor.styled'

// open the link editor for the link under the caret, or to link the selection
export const OPEN_LINK_EDITOR_COMMAND: LexicalCommand<void> = createCommand(
  'OPEN_LINK_EDITOR_COMMAND',
)

// accept urls without a scheme, e.g. ynput.io
export const normalizeUrl = (url: string) => {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^(https?:|mailto:|\/|#)/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

type Rect = { top: number; bottom: number; left: number }

type LinkEditorState =
  // the caret is in an existing link
  | { mode: 'link'; key: NodeKey; url: string; rect: Rect }
  // linking the selection (or inserting a link at the caret)
  | { mode: 'create'; url: string; rect: Rect }

const POPOVER_WIDTH = 320

const toRect = (rect: DOMRect): Rect => ({ top: rect.top, bottom: rect.bottom, left: rect.left })

// the link under the caret, both ends of the selection must be in it
const $getSelectedLink = (): LinkNode | null => {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return null
  const link = $findMatchingParent(selection.anchor.getNode(), $isLinkNode)
  if (!link || ($isAutoLinkNode(link) && link.getIsUnlinked())) return null
  const focusLink = $findMatchingParent(selection.focus.getNode(), $isLinkNode)
  return focusLink && focusLink.is(link) ? link : null
}

/**
 * Inline link editing. Placing the caret in a link shows its url under it, which can be edited,
 * opened or removed. The toolbar link button and mod+K open it to link the selection.
 */
const LinkEditorPlugin = () => {
  const [editor] = useLexicalComposerContext()
  const [state, setState] = useState<LinkEditorState | null>(null)
  const [draftUrl, setDraftUrl] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const savedSelection = useRef<BaseSelection | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const isInputFocused = () => !!inputRef.current && document.activeElement === inputRef.current

  const close = useCallback(
    (refocus = false) => {
      setState(null)
      savedSelection.current = null
      if (refocus) editor.focus()
    },
    [editor],
  )

  // follow the caret in and out of links
  const $syncWithSelection = useCallback(() => {
    // don't move away from the link being edited
    if (isInputFocused()) return
    const link = $getSelectedLink()
    if (!link) {
      if (stateRef.current?.mode === 'link') setState(null)
      return
    }
    const element = editor.getElementByKey(link.getKey())
    if (!element) return
    const url = link.getURL()
    setState({
      mode: 'link',
      key: link.getKey(),
      url,
      rect: toRect(element.getBoundingClientRect()),
    })
    setDraftUrl(url)
  }, [editor])

  const focusInput = () =>
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })

  const open = useCallback(() => {
    let opened = false
    editor.getEditorState().read(() => {
      const link = $getSelectedLink()
      if (link) {
        const element = editor.getElementByKey(link.getKey())
        if (!element) return
        const url = link.getURL()
        setState({
          mode: 'link',
          key: link.getKey(),
          url,
          rect: toRect(element.getBoundingClientRect()),
        })
        setDraftUrl(url)
        opened = true
        return
      }
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      savedSelection.current = selection.clone()
      const domSelection = window.getSelection()
      const range = domSelection?.rangeCount ? domSelection.getRangeAt(0) : null
      let rect = range?.getBoundingClientRect()
      // a collapsed range can have no size, use the element the caret is in
      if (!rect || (!rect.width && !rect.height)) {
        const element = editor.getElementByKey(selection.anchor.key)
        rect = element?.getBoundingClientRect()
      }
      if (!rect) return
      setState({ mode: 'create', url: '', rect: toRect(rect) })
      setDraftUrl('')
      opened = true
    })
    if (opened) focusInput()
    return opened
  }, [editor])

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read($syncWithSelection)
        }),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            $syncWithSelection()
            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          OPEN_LINK_EDITOR_COMMAND,
          () => {
            open()
            return true
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          KEY_DOWN_COMMAND,
          (e) => {
            if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
              e.preventDefault()
              return open()
            }
            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
        // leaving the editor hides the link, unless moving into the link editor
        editor.registerCommand(
          BLUR_COMMAND,
          (e) => {
            const next = e.relatedTarget as Node | null
            if (next && popoverRef.current?.contains(next)) return false
            setState(null)
            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
      ),
    [editor, $syncWithSelection, open],
  )

  // keep it under the link while scrolling
  useLayoutEffect(() => {
    if (!state) return
    const update = () => {
      const current = stateRef.current
      if (current?.mode !== 'link') return
      const element = editor.getElementByKey(current.key)
      if (element) setState({ ...current, rect: toRect(element.getBoundingClientRect()) })
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [editor, !!state])

  const removeLink = () => {
    const current = stateRef.current
    if (current?.mode !== 'link') return
    editor.update(() => {
      const node = $getNodeByKey(current.key)
      if ($isAutoLinkNode(node)) {
        // an auto link would be recreated from the text, mark it as unlinked instead
        node.setIsUnlinked(true)
        node.markDirty()
      } else if ($isLinkNode(node)) {
        $unwrapNode(node)
      }
    })
    close(true)
  }

  const apply = () => {
    const current = stateRef.current
    if (!current) return
    const url = normalizeUrl(draftUrl)

    if (current.mode === 'link') {
      if (!url) {
        removeLink()
        return
      }
      editor.update(() => {
        const node = $getNodeByKey(current.key)
        if ($isAutoLinkNode(node)) {
          // editing an auto link turns it into a normal link, its text no longer sets the url
          const link = $createLinkNode(url)
          link.append(...node.getChildren())
          node.replace(link)
        } else if ($isLinkNode(node)) {
          node.setURL(url)
        }
      })
      close(true)
      return
    }

    if (!url) {
      close(true)
      return
    }
    editor.update(() => {
      if (savedSelection.current) $setSelection(savedSelection.current.clone())
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      // nothing selected: insert the url itself as the link text
      if (selection.isCollapsed()) {
        selection.insertText(url)
        const inserted = $getSelection()
        if ($isRangeSelection(inserted)) {
          const focus = inserted.focus
          inserted.anchor.set(focus.key, focus.offset - url.length, 'text')
        }
      }
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
      // collapse to the end so typing continues after the link
      const after = $getSelection()
      if ($isRangeSelection(after)) {
        const end = after.isBackward() ? after.anchor : after.focus
        after.anchor.set(end.key, end.offset, end.type)
        after.focus.set(end.key, end.offset, end.type)
      }
    })
    close(true)
  }

  if (!state) return null

  const left = Math.max(8, Math.min(state.rect.left, window.innerWidth - POPOVER_WIDTH - 8))
  const isChanged = normalizeUrl(draftUrl) !== state.url

  return createPortal(
    <Styled.LinkPopover
      ref={popoverRef}
      className={clsx('md-popover md-link-popover', BLOCK_DIALOG_CLOSE_CLASS)}
      style={{ top: state.rect.bottom + 6, left, width: POPOVER_WIDTH }}
      // keep the editor selection when clicking buttons (the input still takes focus)
      onMouseDown={(e) => {
        if (e.target !== inputRef.current) e.preventDefault()
      }}
    >
      <Icon icon="link" />
      <input
        ref={inputRef}
        value={draftUrl}
        placeholder="Paste or type a link"
        onChange={(e) => setDraftUrl(e.target.value)}
        // editing usually replaces the whole url
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') {
            e.preventDefault()
            apply()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            // put the caret back where it was
            if (savedSelection.current) {
              const selection = savedSelection.current.clone()
              editor.update(() => $setSelection(selection))
            }
            close(true)
          }
        }}
        onBlur={(e) => {
          // clicked away from both the editor and the link editor
          const next = e.relatedTarget as Node | null
          const root = editor.getRootElement()
          if (next && (popoverRef.current?.contains(next) || root?.contains(next))) return
          close()
        }}
        spellCheck={false}
      />
      {(state.mode === 'create' || isChanged) && (
        <Button
          icon="check"
          variant="text"
          onClick={apply}
          data-tooltip={state.mode === 'create' ? 'Add link' : 'Update link'}
          type="button"
        />
      )}
      {state.mode === 'link' && (
        <>
          <Button
            icon="open_in_new"
            variant="text"
            onClick={() => window.open(state.url, '_blank', 'noopener,noreferrer')}
            data-tooltip="Open link"
            type="button"
          />
          <Button
            icon="link_off"
            variant="text"
            onClick={removeLink}
            data-tooltip="Remove link"
            type="button"
          />
        </>
      )}
    </Styled.LinkPopover>,
    document.body,
  )
}

export default LinkEditorPlugin
