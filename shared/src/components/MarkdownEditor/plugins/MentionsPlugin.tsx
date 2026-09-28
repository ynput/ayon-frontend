import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  type MenuTextMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
  type LexicalCommand,
  type TextNode,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import { Icon } from '@ynput/ayon-react-components'
import UserImage from '../../UserImage'
import { $createMentionNode } from '../nodes/MentionNode'
import type {
  MentionItem,
  MentionPlacement,
  MentionSource,
  MentionTrigger,
  MentionTriggerConfig,
} from '../types'
import * as Styled from '../MarkdownEditor.styled'

const ALL_TRIGGERS: MentionTrigger[] = ['@', '@@', '@@@']

const DEFAULT_CONFIG: Record<MentionTrigger, MentionTriggerConfig> = {
  '@': {
    title: '@ Users & Teams',
    noun: 'user',
    isCircle: true,
    filters: [
      { id: 'user', icon: 'person', tooltip: 'Filter users' },
      { id: 'team', icon: 'group', tooltip: 'Filter teams' },
    ],
  },
  '@@': { title: '@@ Versions', noun: 'version' },
  '@@@': { title: '@@@ Tasks', noun: 'task' },
}

// `@`, `@@` or `@@@` at the start of a word followed by the search (no whitespace or more @)
const MENTION_REGEX = /(^|[\s([{"'])(@{1,3})([^\s@]{0,75})$/

export const INSERT_MENTION_TRIGGER_COMMAND: LexicalCommand<MentionTrigger> = createCommand(
  'INSERT_MENTION_TRIGGER_COMMAND',
)

class MentionMenuOption extends MenuOption {
  item: MentionItem
  constructor(item: MentionItem, index: number) {
    super(`${item.type}:${item.id}:${index}`)
    this.item = item
  }
}

// estimated space the picker needs, used to decide if it opens above or below the caret
const MENU_HEIGHT = 240

interface MentionsPluginProps {
  source: MentionSource
  // DOM element the picker is rendered in, defaults to document.body
  menuParent?: HTMLElement
  // inline: at the caret, top: across the top of the editor (for chat inputs at the bottom of the page)
  placement?: MentionPlacement
}

const MentionsPlugin = ({ source, menuParent, placement = 'inline' }: MentionsPluginProps) => {
  const [editor] = useLexicalComposerContext()
  const [query, setQuery] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  // set by the trigger function, which knows how many @ were typed
  const triggerRef = useRef<MentionTrigger>('@')
  const [trigger, setTrigger] = useState<MentionTrigger>('@')

  const triggers = source.triggers ?? ALL_TRIGGERS
  const limit = source.limit ?? (placement === 'top' ? 8 : 5)

  const triggerFn = useCallback(
    (text: string): MenuTextMatch | null => {
      const match = MENTION_REGEX.exec(text)
      if (!match) return null
      const typed = match[2] as MentionTrigger
      if (!triggers.includes(typed)) return null
      triggerRef.current = typed
      return {
        leadOffset: match.index + match[1].length,
        matchingString: match[3],
        replaceableString: match[2] + match[3],
      }
    },
    [triggers.join()],
  )

  const handleQueryChange = useCallback((matchingString: string | null) => {
    setQuery(matchingString)
    if (matchingString === null) {
      setFilter(null)
      return
    }
    setTrigger((prev) => {
      if (prev !== triggerRef.current) setFilter(null)
      return triggerRef.current
    })
  }, [])

  const config: MentionTriggerConfig = { ...DEFAULT_CONFIG[trigger], ...source.config?.[trigger] }
  const error = query !== null ? source.getError?.(trigger) : null

  const options = useMemo(() => {
    if (query === null || error) return []
    return source
      .getOptions({ trigger, search: query.toLowerCase(), filter })
      .slice(0, limit)
      .map((item, i) => new MentionMenuOption(item, i))
  }, [query, trigger, filter, source, limit, error])

  const onSelectOption = useCallback(
    (option: MentionMenuOption, nodeToReplace: TextNode | null, closeMenu: () => void) => {
      editor.update(() => {
        const { type, id, label } = option.item
        const mentionNode = $createMentionNode(type, id, label)
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode)
        } else {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) selection.insertNodes([mentionNode])
        }
        // continue typing after a space, reusing an existing one
        const next = mentionNode.getNextSibling()
        if ($isTextNode(next) && next.getTextContent().startsWith(' ')) {
          next.select(1, 1)
        } else {
          const space = $createTextNode(' ')
          mentionNode.insertAfter(space)
          space.select(1, 1)
        }
        closeMenu()
      })
    },
    [editor],
  )

  // toolbar buttons type a trigger at the caret, which opens the picker
  useLayoutEffect(
    () =>
      mergeRegister(
        editor.registerCommand(
          INSERT_MENTION_TRIGGER_COMMAND,
          (newTrigger) => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) return false
            // replace an open query so buttons can switch between mention types
            if (query !== null && selection.isCollapsed()) {
              const anchor = selection.anchor
              const node = anchor.getNode()
              if ($isTextNode(node)) {
                const text = node.getTextContent().slice(0, anchor.offset)
                const match = MENTION_REGEX.exec(text)
                if (match) {
                  const start = match.index + match[1].length
                  node.spliceText(start, anchor.offset - start, '', true)
                }
              }
            }
            const current = $getSelection()
            if (!$isRangeSelection(current)) return false
            const anchor = current.anchor
            const before =
              anchor.type === 'text'
                ? anchor.getNode().getTextContent().slice(0, anchor.offset)
                : ''
            const needsSpace = before.length > 0 && !/\s$/.test(before)
            current.insertText((needsSpace ? ' ' : '') + newTrigger)
            return true
          },
          COMMAND_PRIORITY_EDITOR,
        ),
      ),
    [editor, query],
  )

  return (
    <LexicalTypeaheadMenuPlugin<MentionMenuOption>
      onQueryChange={handleQueryChange}
      onSelectOption={onSelectOption}
      triggerFn={triggerFn}
      options={options}
      parent={menuParent}
      // before the enter to submit handler of chat inputs
      commandPriority={COMMAND_PRIORITY_NORMAL}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        const anchor = anchorElementRef.current
        if (!anchor) return null
        // nothing matches the search, get out of the way
        if (!options.length && !error && (query || filter)) return null

        const isTop = placement === 'top'
        // a parent can mark a wider area to span with `md-mention-anchor`
        const root = editor.getRootElement()
        const editorElement = (root?.closest('.md-mention-anchor') ||
          root?.closest('.md-editor')) as HTMLElement | null
        const target = isTop && editorElement ? editorElement : anchor
        const rect = anchor.getBoundingClientRect()
        const openAbove =
          !isTop && window.innerHeight - rect.bottom < MENU_HEIGHT && rect.top > MENU_HEIGHT

        return createPortal(
          <Styled.MentionMenu
            className={clsx('mention-menu', { above: openAbove, top: isTop })}
            // keep focus in the editor when clicking the menu
            onMouseDown={(e) => e.preventDefault()}
          >
            <Styled.MentionMenuTitle>
              <span>{config.title}</span>
              {!!config.filters?.length && (
                <Styled.MentionFilters>
                  {config.filters.map((f) => (
                    <Styled.MentionFilterButton
                      key={f.id}
                      className={clsx({ active: filter === f.id })}
                      onClick={() => setFilter((prev) => (prev === f.id ? null : f.id))}
                      data-tooltip={f.tooltip}
                      data-tooltip-delay={0}
                      type="button"
                    >
                      <Icon icon={f.icon} />
                    </Styled.MentionFilterButton>
                  ))}
                </Styled.MentionFilters>
              )}
            </Styled.MentionMenuTitle>
            <ul role="listbox">
              {options.map((option, i) => {
                const { item } = option
                return (
                  <Styled.MentionMenuItem
                    key={option.key}
                    ref={(el) => option.setRefElement(el)}
                    role="option"
                    aria-selected={selectedIndex === i}
                    className={clsx({ selected: selectedIndex === i, square: !config.isCircle })}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onClick={() => {
                      setHighlightedIndex(i)
                      selectOptionAndCleanUp(option)
                    }}
                  >
                    {source.renderOptionImage ? (
                      source.renderOptionImage(item)
                    ) : item.type === 'user' ? (
                      <UserImage size={20} name={item.id} className="image" />
                    ) : (
                      item.icon && (
                        <Icon icon={item.icon} className="image" style={{ color: item.color }} />
                      )
                    )}
                    {item.context && <span className="context">{item.context} - </span>}
                    <span className="label">{item.label}</span>
                    {item.suffix && <span className="suffix">{item.suffix}</span>}
                  </Styled.MentionMenuItem>
                )
              })}
              {(error || !options.length) && (
                <Styled.MentionMenuItem className="empty">
                  {error || `No ${config.noun}s found`}
                </Styled.MentionMenuItem>
              )}
            </ul>
          </Styled.MentionMenu>,
          target,
        )
      }}
    />
  )
}

export default MentionsPlugin
