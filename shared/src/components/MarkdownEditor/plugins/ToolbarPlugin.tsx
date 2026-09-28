import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type BaseSelection,
  type TextFormatType,
} from 'lexical'
import { Button, Icon, type IconType } from '@ynput/ayon-react-components'
import { DEFAULT_TOOLBAR, type ToolbarItem, type ToolbarLayout } from '../types'
import * as Styled from '../MarkdownEditor.styled'
import { $getBlockType, toggleBlockFormat, type BlockType } from './formatting'

interface ToolbarState {
  blockType: BlockType
  formats: Record<TextFormatType, boolean>
  isLink: boolean
}

const EMPTY_STATE: ToolbarState = {
  blockType: 'paragraph',
  formats: {} as Record<TextFormatType, boolean>,
  isLink: false,
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const MOD = isMac ? '⌘' : 'Ctrl+'

const ITEMS: Record<ToolbarItem, { icon: IconType; tooltip: string; shortcut?: string }> = {
  heading: { icon: 'format_h1', tooltip: 'Heading' },
  bold: { icon: 'format_bold', tooltip: 'Bold', shortcut: `${MOD}B` },
  italic: { icon: 'format_italic', tooltip: 'Italic', shortcut: `${MOD}I` },
  strikethrough: { icon: 'strikethrough_s', tooltip: 'Strikethrough' },
  code: { icon: 'code', tooltip: 'Inline code', shortcut: `${MOD}E` },
  link: { icon: 'link', tooltip: 'Link', shortcut: `${MOD}K` },
  codeBlock: { icon: 'data_object', tooltip: 'Code block', shortcut: '```' },
  quote: { icon: 'format_quote', tooltip: 'Quote', shortcut: '>' },
  numberList: { icon: 'format_list_numbered', tooltip: 'Numbered list', shortcut: '1.' },
  bulletList: { icon: 'format_list_bulleted', tooltip: 'Bullet list', shortcut: '-' },
  checkList: { icon: 'check_circle', tooltip: 'Checklist', shortcut: '[]' },
}

// accept urls without a scheme, e.g. ynput.io
const normalizeUrl = (url: string) => {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^(https?:|mailto:|\/|#)/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

interface ToolbarPluginProps {
  layout?: ToolbarLayout
  start?: ReactNode
  end?: ReactNode
  // show above the selected text instead of at the top of the editor
  floating?: boolean
}

const ToolbarPlugin = ({ layout = DEFAULT_TOOLBAR, start, end, floating }: ToolbarPluginProps) => {
  const [editor] = useLexicalComposerContext()
  const [state, setState] = useState<ToolbarState>(EMPTY_STATE)
  // link editor
  const [linkUrl, setLinkUrl] = useState<string | null>(null)
  const savedSelection = useRef<BaseSelection | null>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  // floating toolbar
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  // the link input takes focus from the editor, keep the toolbar open meanwhile
  const isLinkOpen = useRef(false)

  const updatePosition = useCallback(
    (allowCollapsed = false) => {
      const root = editor.getRootElement()
      const domSelection = window.getSelection()
      const isCollapsed = !!domSelection?.isCollapsed && !allowCollapsed
      if (!root || !domSelection || isCollapsed || !domSelection.rangeCount) {
        setPosition(null)
        return
      }
      if (!root.contains(domSelection.anchorNode)) return
      const rect = domSelection.getRangeAt(0).getBoundingClientRect()
      setPosition({ top: rect.top, left: rect.left + rect.width / 2 })
    },
    [editor],
  )

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    const anchorNode = selection.anchor.getNode()
    const formats = {} as Record<TextFormatType, boolean>
    for (const format of ['bold', 'italic', 'strikethrough', 'code'] as TextFormatType[]) {
      formats[format] = selection.hasFormat(format)
    }
    const node = anchorNode
    if (floating) {
      if (selection.isCollapsed() || $getBlockType(anchorNode) === 'code') setPosition(null)
      else requestAnimationFrame(() => updatePosition())
    }
    setState({
      blockType: $getBlockType(anchorNode),
      formats,
      isLink: $isLinkNode(node.getParent()) || $isLinkNode(node),
    })
  }, [floating, updatePosition])

  const $getSelectedLink = () => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return null
    const node = selection.anchor.getNode()
    return $findMatchingParent(node, $isLinkNode)
  }

  const openLinkEditor = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      savedSelection.current = selection ? selection.clone() : null
      const link = $getSelectedLink()
      setLinkUrl(link ? link.getURL() : '')
    })
    // the floating toolbar hosts the link editor, show it at the caret
    if (floating) updatePosition(true)
  }, [editor, floating, updatePosition])

  const closeLinkEditor = (refocus = true) => {
    setLinkUrl(null)
    isLinkOpen.current = false
    // clicked away from the link editor, the floating toolbar goes with it
    if (!refocus && floating) setPosition(null)
    if (refocus) {
      editor.update(() => {
        if (savedSelection.current) $setSelection(savedSelection.current.clone())
      })
      editor.focus()
    }
  }

  const applyLink = (remove = false) => {
    const url = remove ? null : normalizeUrl(linkUrl || '')
    editor.update(() => {
      if (savedSelection.current) $setSelection(savedSelection.current.clone())
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      // nothing selected and not in a link: insert the url itself as the link text
      if (url && selection.isCollapsed() && !$getSelectedLink()) {
        selection.insertText(url)
        const inserted = $getSelection()
        if ($isRangeSelection(inserted)) {
          const focus = inserted.focus
          inserted.anchor.set(focus.key, focus.offset - url.length, 'text')
        }
      }
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url || null)
      // collapse to the end so typing continues after the link
      const after = $getSelection()
      if ($isRangeSelection(after)) {
        const focus = after.isBackward() ? after.anchor : after.focus
        after.anchor.set(focus.key, focus.offset, focus.type)
        after.focus.set(focus.key, focus.offset, focus.type)
      }
    })
    setLinkUrl(null)
    editor.focus()
  }

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read($updateToolbar)
        }),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            $updateToolbar()
            return false
          },
          COMMAND_PRIORITY_CRITICAL,
        ),
        editor.registerCommand(
          BLUR_COMMAND,
          () => {
            if (!isLinkOpen.current) setPosition(null)
            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          KEY_DOWN_COMMAND,
          (e) => {
            if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
              e.preventDefault()
              openLinkEditor()
              return true
            }
            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
      ),
    [editor, $updateToolbar, openLinkEditor],
  )

  // keep the floating toolbar on the selection while scrolling
  useEffect(() => {
    if (!floating || !position) return
    const update = () => updatePosition(linkUrl !== null)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [floating, !!position, updatePosition, linkUrl !== null])

  useEffect(() => {
    isLinkOpen.current = linkUrl !== null
    if (linkUrl !== null) linkInputRef.current?.focus()
  }, [linkUrl !== null])

  const handleItem = (item: ToolbarItem) => {
    switch (item) {
      case 'bold':
      case 'italic':
      case 'strikethrough':
      case 'code':
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, item)
        break
      case 'heading':
        toggleBlockFormat(editor, 'h2')
        break
      case 'quote':
        toggleBlockFormat(editor, 'quote')
        break
      case 'codeBlock':
        toggleBlockFormat(editor, 'code')
        break
      case 'link':
        if (state.isLink) editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
        else openLinkEditor()
        break
      case 'bulletList':
        toggleBlockFormat(editor, 'bullet')
        break
      case 'numberList':
        toggleBlockFormat(editor, 'number')
        break
      case 'checkList':
        toggleBlockFormat(editor, 'check')
        break
    }
  }

  const isActive = (item: ToolbarItem) => {
    switch (item) {
      case 'bold':
      case 'italic':
      case 'strikethrough':
      case 'code':
        return !!state.formats[item]
      case 'heading':
        return state.blockType === 'h2' || state.blockType === 'heading'
      case 'quote':
        return state.blockType === 'quote'
      case 'codeBlock':
        return state.blockType === 'code'
      case 'link':
        return state.isLink
      case 'bulletList':
        return state.blockType === 'bullet'
      case 'numberList':
        return state.blockType === 'number'
      case 'checkList':
        return state.blockType === 'check'
    }
  }

  // text formats make no sense inside a code block
  const isDisabled = (item: ToolbarItem) =>
    state.blockType === 'code' && ['bold', 'italic', 'strikethrough', 'code', 'link'].includes(item)

  const items = (
    <Styled.ToolbarItems>
      {layout.map((item, i) =>
        item === '|' ? (
          <Styled.ToolbarDivider key={`divider-${i}`} className="md-toolbar-divider" />
        ) : (
          <Fragment key={item}>
            <Button
              icon={ITEMS[item].icon}
              variant="text"
              className={clsx('md-toolbar-button', `md-toolbar-item-${item}`, {
                active: isActive(item),
              })}
              disabled={isDisabled(item)}
              data-tooltip={ITEMS[item].tooltip}
              data-shortcut={ITEMS[item].shortcut}
              aria-pressed={isActive(item)}
              // keep the editor selection
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleItem(item)}
              type="button"
            />
          </Fragment>
        ),
      )}
    </Styled.ToolbarItems>
  )

  const linkEditor = (
    <>
      {linkUrl !== null && (
        <Styled.LinkEditor className="md-link-editor">
          <Icon icon="link" />
          <input
            ref={linkInputRef}
            value={linkUrl}
            placeholder="Paste or type a link"
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') {
                e.preventDefault()
                applyLink()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                closeLinkEditor()
              }
            }}
            onBlur={() => closeLinkEditor(false)}
          />
          <Button
            icon="check"
            variant="text"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyLink()}
            data-tooltip="Apply link"
            type="button"
          />
          {state.isLink && (
            <Button
              icon="link_off"
              variant="text"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyLink(true)}
              data-tooltip="Remove link"
              type="button"
            />
          )}
        </Styled.LinkEditor>
      )}
    </>
  )

  if (floating) {
    if (!position) return null
    return createPortal(
      <Styled.FloatingToolbar
        className="md-toolbar md-floating-toolbar"
        style={{ top: position.top, left: position.left }}
      >
        {items}
        {linkEditor}
      </Styled.FloatingToolbar>,
      document.body,
    )
  }

  return (
    <Styled.Toolbar className="md-toolbar">
      {start}
      {items}
      {end}
      {linkEditor}
    </Styled.Toolbar>
  )
}

export default ToolbarPlugin
