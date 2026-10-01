import { Fragment, useCallback, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isLinkNode } from '@lexical/link'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type TextFormatType,
} from 'lexical'
import { Button, type IconType } from '@ynput/ayon-react-components'
import { BLOCK_DIALOG_CLOSE_CLASS } from '@shared/components/LinksManager/CellEditingDialog'
import { DEFAULT_TOOLBAR, type ToolbarItem, type ToolbarLayout } from '../types'
import * as Styled from '../MarkdownEditor.styled'
import { $getBlockType, toggleBlockFormat, type BlockType } from './formatting'
import { OPEN_LINK_EDITOR_COMMAND } from './LinkEditorPlugin'

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
  h1: { icon: 'format_h1', tooltip: 'Heading 1', shortcut: '#' },
  h2: { icon: 'format_h2', tooltip: 'Heading 2', shortcut: '##' },
  h3: { icon: 'format_h3', tooltip: 'Heading 3', shortcut: '###' },
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
  // floating toolbar
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  const updatePosition = useCallback(() => {
    const root = editor.getRootElement()
    const domSelection = window.getSelection()
    if (!root || !domSelection || domSelection.isCollapsed || !domSelection.rangeCount) {
      setPosition(null)
      return
    }
    if (!root.contains(domSelection.anchorNode)) return
    const rect = domSelection.getRangeAt(0).getBoundingClientRect()
    setPosition({ top: rect.top, left: rect.left + rect.width / 2 })
  }, [editor])

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    const anchorNode = selection.anchor.getNode()
    const formats = {} as Record<TextFormatType, boolean>
    for (const format of ['bold', 'italic', 'strikethrough', 'code'] as TextFormatType[]) {
      formats[format] = selection.hasFormat(format)
    }
    if (floating) {
      if (selection.isCollapsed() || $getBlockType(anchorNode) === 'code') setPosition(null)
      else requestAnimationFrame(() => updatePosition())
    }
    setState({
      blockType: $getBlockType(anchorNode),
      formats,
      isLink: !!$findMatchingParent(anchorNode, $isLinkNode),
    })
  }, [floating, updatePosition])

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
            setPosition(null)
            return false
          },
          COMMAND_PRIORITY_LOW,
        ),
      ),
    [editor, $updateToolbar],
  )

  // keep the floating toolbar on the selection while scrolling
  useEffect(() => {
    if (!floating || !position) return
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [floating, !!position, updatePosition])

  const handleItem = (item: ToolbarItem) => {
    switch (item) {
      case 'bold':
      case 'italic':
      case 'strikethrough':
      case 'code':
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, item)
        break
      case 'h1':
      case 'h2':
      case 'h3':
        toggleBlockFormat(editor, item)
        break
      case 'quote':
        toggleBlockFormat(editor, 'quote')
        break
      case 'codeBlock':
        toggleBlockFormat(editor, 'code')
        break
      case 'link':
        // edit the link under the caret or link the selection
        setPosition(null)
        editor.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined)
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
      case 'h1':
      case 'h2':
      case 'h3':
        return state.blockType === item
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

  if (floating) {
    if (!position) return null
    return createPortal(
      <Styled.FloatingToolbar
        className={clsx('md-toolbar md-floating-toolbar md-popover', BLOCK_DIALOG_CLOSE_CLASS)}
        style={{ top: position.top, left: position.left }}
      >
        {items}
      </Styled.FloatingToolbar>,
      document.body,
    )
  }

  return (
    <Styled.Toolbar className="md-toolbar">
      {start}
      {items}
      {end}
    </Styled.Toolbar>
  )
}

export default ToolbarPlugin
