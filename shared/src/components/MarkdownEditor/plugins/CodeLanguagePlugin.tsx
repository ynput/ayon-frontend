import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isCodeNode, CodeNode } from '@lexical/code'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  type NodeKey,
} from 'lexical'
import { Dropdown, Icon } from '@ynput/ayon-react-components'
import { BLOCK_DIALOG_CLOSE_CLASS } from '@shared/components/LinksManager/CellEditingDialog'
import { CODE_LANGUAGES, getCodeLanguageLabel } from '../code/prism'
import * as Styled from '../MarkdownEditor.styled'

interface ActiveCode {
  key: NodeKey
  language: string
  rect: { top: number; right: number }
}

/**
 * A language picker on the top right of the code block being hovered or edited. The language is
 * written to markdown as the fence info string and sets the syntax highlighting.
 */
const CodeLanguagePlugin = () => {
  const [editor] = useLexicalComposerContext()
  const [active, setActive] = useState<ActiveCode | null>(null)
  const hoveredRef = useRef<NodeKey | null>(null)
  const controlRef = useRef<HTMLDivElement>(null)
  // keep the picker on its code block while the list is open
  const isOpenRef = useRef(false)

  // the hovered code block wins over the one with the caret
  const refresh = useCallback(() => {
    if (isOpenRef.current) return
    editor.getEditorState().read(() => {
      let node: CodeNode | null = null
      if (hoveredRef.current) {
        const hovered = $getNodeByKey(hoveredRef.current)
        if ($isCodeNode(hovered)) node = hovered
      }
      if (!node) {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          node = $findMatchingParent(selection.anchor.getNode(), $isCodeNode)
        }
      }
      const element = node && editor.getElementByKey(node.getKey())
      if (!node || !element) {
        setActive(null)
        return
      }
      const rect = element.getBoundingClientRect()
      setActive({
        key: node.getKey(),
        language: node.getLanguage() || '',
        rect: { top: rect.top, right: rect.right },
      })
    })
  }, [editor])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const code = (e.target as HTMLElement | null)?.closest?.('code')
      let key: NodeKey | null = null
      if (code) {
        editor.getEditorState().read(() => {
          const node = $getNearestNodeFromDOMNode(code)
          const codeNode = node && $findMatchingParent(node, $isCodeNode)
          key = codeNode ? codeNode.getKey() : null
        })
      }
      if (key !== hoveredRef.current) {
        hoveredRef.current = key
        refresh()
      }
    }
    const onLeave = (e: MouseEvent) => {
      // moving onto the picker keeps it
      if (isOpenRef.current || controlRef.current?.contains(e.relatedTarget as Node)) return
      hoveredRef.current = null
      refresh()
    }

    let currentRoot: HTMLElement | null = null
    return mergeRegister(
      editor.registerRootListener((root, prevRoot) => {
        prevRoot?.removeEventListener('mousemove', onMove)
        prevRoot?.removeEventListener('mouseleave', onLeave)
        root?.addEventListener('mousemove', onMove)
        root?.addEventListener('mouseleave', onLeave)
        currentRoot = root
      }),
      editor.registerUpdateListener(() => refresh()),
      () => {
        currentRoot?.removeEventListener('mousemove', onMove)
        currentRoot?.removeEventListener('mouseleave', onLeave)
      },
    )
  }, [editor, refresh])

  // follow the code block while scrolling
  useEffect(() => {
    if (!active) return
    window.addEventListener('scroll', refresh, true)
    window.addEventListener('resize', refresh)
    return () => {
      window.removeEventListener('scroll', refresh, true)
      window.removeEventListener('resize', refresh)
    }
  }, [!!active, refresh])

  const setLanguage = (language: string) => {
    const current = active
    if (!current) return
    editor.update(() => {
      const node = $getNodeByKey(current.key)
      if (!$isCodeNode(node)) return
      node.setLanguage(language || null)
      // back to writing the code
      node.selectEnd()
    })
    editor.focus()
  }

  if (!active) return null

  // a language from markdown that isn't in the list (e.g. `py`) is still shown
  const options = CODE_LANGUAGES.some((option) => option.value === active.language)
    ? CODE_LANGUAGES
    : [...CODE_LANGUAGES, { value: active.language, label: active.language }]

  return createPortal(
    <Styled.CodeLanguage
      ref={controlRef}
      className={clsx('md-popover md-code-language', BLOCK_DIALOG_CLOSE_CLASS)}
      style={{ top: active.rect.top + 4, left: active.rect.right - 4 }}
      onMouseLeave={(e) => {
        if (isOpenRef.current) return
        const root = editor.getRootElement()
        if (root?.contains(e.relatedTarget as Node)) return
        hoveredRef.current = null
        refresh()
      }}
    >
      <Dropdown
        options={options}
        value={[active.language]}
        dataKey="value"
        labelKey="label"
        search
        searchFields={['label', 'value']}
        align="right"
        widthExpand
        onOpen={() => {
          isOpenRef.current = true
        }}
        onClose={() => {
          isOpenRef.current = false
        }}
        onChange={(added) => {
          isOpenRef.current = false
          setLanguage(added[0] ?? '')
        }}
        listClassName={clsx('md-code-language-list', BLOCK_DIALOG_CLOSE_CLASS)}
        valueTemplate={() => (
          <Styled.CodeLanguageButton className="md-code-language-button">
            <span>{getCodeLanguageLabel(active.language) || 'Plain text'}</span>
            <Icon icon="expand_more" />
          </Styled.CodeLanguageButton>
        )}
      />
    </Styled.CodeLanguage>,
    document.body,
  )
}

export default CodeLanguagePlugin
