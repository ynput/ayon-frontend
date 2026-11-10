import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  type MenuTextMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import {
  $addUpdateTag,
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_NORMAL,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  HISTORY_MERGE_TAG,
  PASTE_COMMAND,
  $createRangeSelection,
  $getNearestNodeFromDOMNode,
  $getRoot,
  $setSelection,
  type LexicalEditor,
  SKIP_DOM_SELECTION_TAG,
  type LexicalNode,
  type TextNode,
} from 'lexical'
import { $createLinkNode, $isLinkNode } from '@lexical/link'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import { Icon } from '@ynput/ayon-react-components'
import UserImage from '../../UserImage'
import { $createMentionNode, $isMentionNode, type MentionNode } from '../nodes/MentionNode'
import type {
  MentionEntityRef,
  MentionItem,
  MentionPlacement,
  MentionSource,
  MentionTrigger,
  MentionTriggerConfig,
} from '../types'
import * as Styled from '../MarkdownEditor.styled'
import SuggestionMenu from './SuggestionMenu'
import { $isSelectionInCode } from './selectionHelpers'
import { INSERT_MENTION_TRIGGER_COMMAND } from './MentionsPluginHelpers'
import {
  ENTITY_DRAG_TYPE,
  getEntityDragData,
  getEntityLink,
  parseEntityLink,
} from '../links/entityLinks'
import { caretFromPoint } from '@lexical/clipboard'
import { getRequestErrorString } from '@shared/util'

const ALL_TRIGGERS: MentionTrigger[] = ['@', '@@', '@@@']

const DEFAULT_CONFIG: Record<MentionTrigger, MentionTriggerConfig> = {
  '@': {
    title: '@ Users & Teams',
    noun: 'user',
    filters: [
      { id: 'user', icon: 'person', tooltip: 'Filter users' },
      { id: 'team', icon: 'group', tooltip: 'Filter teams' },
    ],
  },
  '@@': { title: '@@ Versions', noun: 'version' },
  '@@@': { title: '@@@ Tasks', noun: 'task' },
}

// wait for typing to pause before searching beyond the given options
const SEARCH_DEBOUNCE_MS = 250
// shorter searches match too much to be useful
const MIN_SEARCH_LENGTH = 2
// the entity type shown at the end of an option, e.g. `task` -> `Task`
const getTypeLabel = (type: string) => type.charAt(0).toUpperCase() + type.slice(1)
// slots of the limit kept for search results when the given options would fill it
const MIN_SEARCH_SLOTS = 2

const getItemKey = (item: MentionItem) => `${item.type}:${item.id}`

// the last option while a filter can be browsed, opens the dialog of the source
const BROWSE_TYPE = '__browse'

// mentions in place of the typed trigger (or at the caret), separated by spaces, then a space to
// continue typing after, with the caret after it unless `select` is false
const $insertMentions = (
  items: Pick<MentionItem, 'type' | 'id' | 'label' | 'mentionLabel'>[],
  nodeToReplace: LexicalNode | null,
  { select = true } = {},
): MentionNode[] => {
  const nodes = items.map(({ type, id, label, mentionLabel }) =>
    $createMentionNode(type, id, mentionLabel || label),
  )
  if (!nodes.length) return []
  if (nodeToReplace) {
    nodeToReplace.replace(nodes[0])
  } else {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return []
    selection.insertNodes([nodes[0]])
  }
  let last = nodes[0]
  for (const node of nodes.slice(1)) {
    const space = $createTextNode(' ')
    last.insertAfter(space)
    space.insertAfter(node)
    last = node
  }
  // reuse an existing space
  const next = last.getNextSibling()
  if ($isTextNode(next) && next.getTextContent().startsWith(' ')) {
    if (select) next.select(1, 1)
  } else {
    const space = $createTextNode(' ')
    last.insertAfter(space)
    if (select) space.select(1, 1)
  }
  return nodes
}

// the update that inserts entity mentions
const ENTITY_MENTION_TAG = 'entity-mention-insert'

// the label of a pasted entity until it is found
const PENDING_MENTION_LABEL = '…'

/**
 * Inserts mentions of entities at the selection, labelled with what is known until the entities
 * are found: the name of a dragged entity, `…` for a pasted link. Each is then labelled as in the
 * picker, or replaced with its link when its entity is not found (e.g. another project).
 */
const $insertEntityMentions = (
  editor: LexicalEditor,
  resolve: NonNullable<MentionSource['resolve']>,
  entities: { ref: MentionEntityRef; url: string; label?: string }[],
) => {
  $addUpdateTag(ENTITY_MENTION_TAG)
  const nodes = $insertMentions(
    entities.map(({ ref, label }) => ({
      type: ref.type,
      id: ref.id,
      label: label || PENDING_MENTION_LABEL,
    })),
    null,
  )
  if (!nodes.length) return
  const keys = nodes.map((node) => node.getKey())

  // other edits before the entities are found make the labels an undo step of their own
  let edited = false
  const stopWatching = editor.registerUpdateListener(({ dirtyElements, dirtyLeaves, tags }) => {
    if (tags.has(ENTITY_MENTION_TAG)) return
    if (dirtyElements.size || dirtyLeaves.size) edited = true
  })

  resolve(entities.map(({ ref }) => ref))
    .catch(() => [])
    .then((items) => {
      stopWatching()
      editor.update(
        () => {
          entities.forEach(({ url }, i) => {
            const node = $getNodeByKey(keys[i])
            // deleted in the meantime
            if (!$isMentionNode(node) || !node.isAttached()) return
            const item = items[i]
            if (!item) {
              node.replace($createLinkNode(url).append($createTextNode(url)))
              return
            }
            const mention = $createMentionNode(item.type, item.id, item.mentionLabel || item.label)
            if (mention.getTextContent() !== node.getTextContent()) node.replace(mention)
          })
        },
        // undo goes back to before the paste or drop
        { tag: edited ? ENTITY_MENTION_TAG : [ENTITY_MENTION_TAG, HISTORY_MERGE_TAG] },
      )
    })
}

// the caret where a drag is dropped, the end of the text when there is none
const $selectDropPoint = (editor: LexicalEditor, event: DragEvent) => {
  const point = caretFromPoint(event.clientX, event.clientY, editor.getRootElement())
  const selection = $createRangeSelection()
  if (point && $getNearestNodeFromDOMNode(point.node)) {
    // the same mapping as a click, which keeps the offset in an empty paragraph
    selection.applyDOMRange(
      new StaticRange({
        startContainer: point.node,
        startOffset: point.offset,
        endContainer: point.node,
        endOffset: point.offset,
      }),
    )
  }
  if (selection.anchor.key === 'root') {
    $getRoot().selectEnd()
    return
  }
  $setSelection(selection)
}

// `@`, `@@` or `@@@` at the start of a word followed by the search (no whitespace or more @)
const MENTION_REGEX = /(^|[\s([{"'])(@{1,3})([^\s@]{0,75})$/
// the same, words separated by single spaces, for a project search: `@sh010 render v3`
const MENTION_WORDS_REGEX = /(^|[\s([{"'])(@{1,3})((?:[^\s@]+(?: [^\s@]+)* ?)?)$/
const MAX_QUERY_LENGTH = 75

// the browse dialog of a filter, opened from the typed trigger
interface Browsing {
  type: string
  nodeKey: string | null
}

class MentionMenuOption extends MenuOption {
  item: MentionItem
  constructor(item: MentionItem, index: number) {
    super(`${item.type}:${item.id}:${index}`)
    this.item = item
  }
}

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

  // the typed trigger is kept (as a token) while the browse dialog is open. The ref is the open
  // dialog, a pick or close of a dialog closed already (e.g. a late lookup) is ignored.
  const [browsing, setBrowsingState] = useState<Browsing | null>(null)
  const browsingRef = useRef<Browsing | null>(null)
  const setBrowsing = useCallback((value: Browsing | null) => {
    browsingRef.current = value
    setBrowsingState(value)
  }, [])
  useEffect(
    () => () => {
      browsingRef.current = null
    },
    [],
  )

  const triggers = source.triggers ?? ALL_TRIGGERS
  const limit = source.limit ?? (placement === 'top' ? 8 : 5)

  // a project search narrows by several words, e.g. the folder, product and version
  const allowSpaces = !!source.search
  const triggerFn = useCallback(
    (text: string): MenuTextMatch | null => {
      // no mentions while writing code
      if ($isSelectionInCode()) return null
      const match = (allowSpaces ? MENTION_WORDS_REGEX : MENTION_REGEX).exec(text)
      if (!match || match[3].length > MAX_QUERY_LENGTH) return null
      const typed = match[2] as MentionTrigger
      if (!triggers.includes(typed)) return null
      triggerRef.current = typed
      return {
        leadOffset: match.index + match[1].length,
        matchingString: match[3],
        replaceableString: match[2] + match[3],
      }
    },
    [triggers.join(), allowSpaces],
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

  // search beyond the given options, debounced, only the latest search is shown
  const search = source.search
  const searchText = query?.trim().toLowerCase() ?? ''
  const searchKey =
    search && !error && searchText.length >= MIN_SEARCH_LENGTH
      ? `${trigger}|${filter ?? ''}|${searchText}`
      : null
  const [searchResult, setSearchResult] = useState<{
    key: string
    items: MentionItem[]
    error?: string
  } | null>(null)

  useEffect(() => {
    if (!search || !searchKey) return
    let cancelled = false
    const timer = setTimeout(() => {
      search({ trigger, search: searchText, filter })
        .then(
          (items) => ({ items }),
          (err) => ({ items: [], error: getRequestErrorString(err) || 'Search failed' }),
        )
        .then((result) => !cancelled && setSearchResult({ key: searchKey, ...result }))
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, searchKey, trigger, searchText, filter])

  const searchItems = searchResult?.key === searchKey ? searchResult.items : null
  const searchError = searchResult?.key === searchKey ? searchResult.error : undefined
  const isSearching = !!searchKey && !searchItems

  const browseType = filter && source.browse?.types.includes(filter) ? filter : null

  const results = useMemo(() => {
    if (query === null || error) return []
    const given = source.getOptions({ trigger, search: searchText, filter })
    // the browse option takes the last slot
    const max = browseType ? limit - 1 : limit
    // search results not given already fill the limit after the given options,
    // keeping at least `MIN_SEARCH_SLOTS`
    const listed = new Set(given.map(getItemKey))
    const found = (searchItems ?? []).filter((item) => !listed.has(getItemKey(item)))
    const givenSlots = found.length ? Math.max(max - found.length, max - MIN_SEARCH_SLOTS) : max
    return [...given.slice(0, givenSlots), ...found].slice(0, max)
  }, [query, searchText, trigger, filter, source, limit, error, searchItems, browseType])
  const hasResults = results.length > 0

  // nothing matches the search, the menu gets out of the way with nothing left to pick (enter
  // would pick a hidden option). A filter keeps the menu, it is the only way to turn the filter
  // off again, until a space shows the mention is done.
  const isHidden =
    !hasResults &&
    !error &&
    !searchError &&
    !isSearching &&
    !!query &&
    (!filter || query.includes(' '))

  const options = useMemo(() => {
    if (query === null || error || isHidden) return []
    const items: MentionItem[] = browseType
      ? [
          ...results,
          {
            type: BROWSE_TYPE,
            id: browseType,
            label: `Browse ${browseType}s…`,
            icon: 'manage_search',
          },
        ]
      : results
    return items.map((item, i) => new MentionMenuOption(item, i))
  }, [query, error, isHidden, results, browseType])

  const onSelectOption = useCallback(
    (option: MentionMenuOption, nodeToReplace: TextNode | null, closeMenu: () => void) => {
      editor.update(() => {
        if (option.item.type === BROWSE_TYPE) {
          // a token is not merged into the text around it, so it can be replaced after the dialog
          nodeToReplace?.setMode('token')
          // the editor keeps no focus, the dialog takes it
          $addUpdateTag(SKIP_DOM_SELECTION_TAG)
          setBrowsing({ type: option.item.id, nodeKey: nodeToReplace?.getKey() ?? null })
        } else {
          $insertMentions([option.item], nodeToReplace)
        }
        closeMenu()
      })
    },
    [editor, setBrowsing],
  )

  const getBrowsedNode = (nodeKey: string | null) => {
    const node = nodeKey ? $getNodeByKey(nodeKey) : null
    return $isTextNode(node) && node.isAttached() ? node : null
  }

  // the picked entities replace the typed trigger, none found is a close
  const handleBrowsePick = (session: Browsing, items: MentionItem[]) => {
    if (browsingRef.current !== session) return
    if (!items.length) return handleBrowseClose(session)
    setBrowsing(null)
    editor.update(() => $insertMentions(items, getBrowsedNode(session.nodeKey)))
    editor.focus()
  }

  // back to the picker, with the same filter
  const handleBrowseClose = (session: Browsing) => {
    if (browsingRef.current !== session) return
    const { type, nodeKey } = session
    setBrowsing(null)
    editor.update(() => {
      const node = getBrowsedNode(nodeKey)
      node?.setMode('normal')
      node?.selectEnd()
    })
    editor.focus(() => setFilter(type))
  }

  // a pasted link to a folder, task or version, or one dropped from a table, becomes its mention
  const resolve = source.resolve
  useEffect(() => {
    if (!resolve) return
    return mergeRegister(
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          if (!(event instanceof ClipboardEvent) || !event.clipboardData) return false
          const url = event.clipboardData.getData('text/plain').trim()
          const ref = parseEntityLink(url)
          if (!ref) return false
          // pasting over a selection links the selection, a link in code stays text
          const selection = $getSelection()
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false
          if ($isSelectionInCode()) return false
          if ($findMatchingParent(selection.anchor.getNode(), $isLinkNode)) return false

          event.preventDefault()
          $insertEntityMentions(editor, resolve, [{ ref, url }])
          return true
        },
        // before the rich text paste
        COMMAND_PRIORITY_NORMAL,
      ),
      // entities can be dropped (the editor takes text moves only)
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event) => {
          if (!event.dataTransfer?.types.includes(ENTITY_DRAG_TYPE)) return false
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
          return true
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          const entities = getEntityDragData(event.dataTransfer).flatMap(({ label, ...ref }) => {
            const url = getEntityLink(ref)
            return url ? [{ ref, url, label }] : []
          })
          if (!entities.length) return false
          event.preventDefault()
          $selectDropPoint(editor, event)
          $insertEntityMentions(editor, resolve, entities)
          // dropped from outside: the editor takes the focus to keep typing
          setTimeout(() => editor.focus())
          return true
        },
        // before the rich text drop
        COMMAND_PRIORITY_NORMAL,
      ),
    )
  }, [editor, resolve])

  // toolbar buttons type a trigger at the caret, which opens the picker
  useLayoutEffect(
    () =>
      mergeRegister(
        editor.registerCommand(
          INSERT_MENTION_TRIGGER_COMMAND,
          (payload) => {
            const { trigger: newTrigger, filter: newFilter = null } =
              typeof payload === 'string' ? { trigger: payload } : payload
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) return false
            // replace an open query so buttons can switch between mention types
            if (query !== null && selection.isCollapsed()) {
              const anchor = selection.anchor
              const node = anchor.getNode()
              if ($isTextNode(node)) {
                const text = node.getTextContent().slice(0, anchor.offset)
                const match = (allowSpaces ? MENTION_WORDS_REGEX : MENTION_REGEX).exec(text)
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
            setFilter(newFilter)
            return true
          },
          COMMAND_PRIORITY_EDITOR,
        ),
      ),
    [editor, query, allowSpaces],
  )

  return (
    <>
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
          // no query: the trigger is gone. Typing fast can leave Lexical's menu open (its close
          // reads a stale state), but the query is already cleared.
          if (!anchor || query === null) return null
          if (isHidden) return null

          return (
            <SuggestionMenu
              editor={editor}
              anchor={anchor}
              placement={placement}
              title={config.title}
              titleActions={
                !!config.filters?.length && (
                  <Styled.MentionFilters>
                    {config.filters.map((f) => (
                      <Styled.MentionFilterButton
                        key={f.id}
                        className={clsx({ active: filter === f.id })}
                        onClick={() => setFilter((prev) => (prev === f.id ? null : f.id))}
                        data-tooltip={f.tooltip}
                        aria-label={f.tooltip}
                        data-tooltip-delay={0}
                        type="button"
                      >
                        <Icon icon={f.icon} />
                      </Styled.MentionFilterButton>
                    ))}
                  </Styled.MentionFilters>
                )
              }
              options={options}
              // the browse option on its own, after the results or the empty message
              getGroup={(option) => (option.item.type === BROWSE_TYPE ? 'browse' : 'results')}
              isEmpty={!hasResults}
              selectedIndex={selectedIndex}
              onSelect={selectOptionAndCleanUp}
              onHighlight={setHighlightedIndex}
              // users and teams are round, entities square
              optionClassName={({ item }) =>
                item.type === 'user' || item.type === 'team' ? undefined : 'square'
              }
              emptyMessage={
                error ||
                searchError ||
                (isSearching
                  ? 'Searching…'
                  : search && filter && !searchText
                  ? 'Type to search'
                  : `No ${config.noun}s found`)
              }
              renderOption={({ item }) => (
                <>
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
                  {item.type !== BROWSE_TYPE && (
                    <span className="type">{getTypeLabel(item.type)}</span>
                  )}
                </>
              )}
            />
          )
        }}
      />
      {browsing &&
        source.browse?.render({
          type: browsing.type,
          onPick: (items) => handleBrowsePick(browsing, items),
          onClose: () => handleBrowseClose(browsing),
        })}
    </>
  )
}

export default MentionsPlugin
