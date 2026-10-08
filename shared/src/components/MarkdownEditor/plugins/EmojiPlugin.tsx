import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  type MenuTextMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import {
  $createTextNode,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_NORMAL,
  type TextNode,
} from 'lexical'
import { getEmojiSuggestions, type EmojiMatch } from '../emoji/emojiData'
import { EMOJI_USED_COMMAND } from '../emoji/commands'
import { useEmojiUsage } from '../emoji/useEmojiUsage'
import { $isSelectionInCode } from './selectionHelpers'
import type { MentionPlacement } from '../types'
import SuggestionMenu from './SuggestionMenu'

// `:` at the start of a word followed by the shortcode, so times (10:30), urls (https://) and a
// colon at the end of a word don't open the picker
const EMOJI_REGEX = /(^|[\s([{"'])(:)([a-z0-9_+-]{0,40})$/i

class EmojiOption extends MenuOption {
  emoji: EmojiMatch
  constructor(emoji: EmojiMatch) {
    super(emoji.name)
    this.emoji = emoji
  }
}

interface EmojiPluginProps {
  // inline: at the caret, top: across the top of the editor
  placement?: MentionPlacement
  // DOM element the typeahead anchor is rendered in, defaults to document.body
  menuParent?: HTMLElement
}

/**
 * Type `:` to pick an emoji, inserted as the unicode character. Right after the `:` the user's
 * most used emoji are suggested (common ones until they have picked any), typing searches them.
 */
const EmojiPlugin = ({ placement = 'inline', menuParent }: EmojiPluginProps) => {
  const [editor] = useLexicalComposerContext()
  const [query, setQuery] = useState<string | null>(null)
  const limit = placement === 'top' ? 8 : 5
  const { usage, recordUse } = useEmojiUsage()

  const options = useMemo(
    () =>
      query === null
        ? []
        : getEmojiSuggestions(query, usage, limit).map((emoji) => new EmojiOption(emoji)),
    [query, limit, usage],
  )

  // count picked and typed (`:tada:`) emoji
  useEffect(
    () =>
      editor.registerCommand(
        EMOJI_USED_COMMAND,
        (name) => {
          recordUse(name)
          return false
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    [editor, recordUse],
  )

  const triggerFn = useCallback((text: string): MenuTextMatch | null => {
    // no emoji picker while writing code
    if ($isSelectionInCode()) return null
    const match = EMOJI_REGEX.exec(text)
    if (!match) return null
    return {
      leadOffset: match.index + match[1].length,
      matchingString: match[3],
      replaceableString: match[2] + match[3],
    }
  }, [])

  const onSelectOption = useCallback(
    (option: EmojiOption, nodeToReplace: TextNode | null, closeMenu: () => void) => {
      editor.update(() => {
        if (!nodeToReplace) return
        const emojiNode = $createTextNode(option.emoji.char).setFormat(nodeToReplace.getFormat())
        nodeToReplace.replace(emojiNode)
        // continue typing after a space, reusing an existing one
        const next = emojiNode.getNextSibling()
        if ($isTextNode(next) && next.getTextContent().startsWith(' ')) {
          next.select(1, 1)
        } else {
          const space = $createTextNode(' ')
          emojiNode.insertAfter(space)
          space.select(1, 1)
        }
        closeMenu()
      })
      editor.dispatchCommand(EMOJI_USED_COMMAND, option.emoji.name)
    },
    [editor],
  )

  return (
    <LexicalTypeaheadMenuPlugin<EmojiOption>
      onQueryChange={setQuery}
      onSelectOption={onSelectOption}
      triggerFn={triggerFn}
      options={options}
      parent={menuParent}
      // before the enter to submit handler of chat inputs
      commandPriority={COMMAND_PRIORITY_NORMAL}
      // a bare `:` shows suggestions, but enter should still add a line / send until one is chosen
      preselectFirstItem={!!query}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        const anchor = anchorElementRef.current
        // nothing matches, get out of the way (a colon is often just a colon)
        if (!anchor || !options.length) return null
        return (
          <SuggestionMenu
            editor={editor}
            anchor={anchor}
            placement={placement}
            className="emoji-menu"
            title={
              query
                ? `Emoji matching :${query}`
                : Object.keys(usage).length
                ? 'Frequently used'
                : 'Popular emoji'
            }
            options={options}
            selectedIndex={selectedIndex}
            onSelect={selectOptionAndCleanUp}
            onHighlight={setHighlightedIndex}
            renderOption={({ emoji }) => (
              <>
                <span className="image emoji" aria-hidden>
                  {emoji.char}
                </span>
                <span className="label">:{emoji.name}:</span>
                {emoji.matchedKeyword && <span className="suffix">{emoji.matchedKeyword}</span>}
              </>
            )}
          />
        )
      }}
    />
  )
}

export default EmojiPlugin
