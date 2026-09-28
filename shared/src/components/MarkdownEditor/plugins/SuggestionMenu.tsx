import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import type { LexicalEditor } from 'lexical'
import type { MenuOption } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import type { MentionPlacement } from '../types'
import { BLOCK_DIALOG_CLOSE_CLASS } from '@shared/components/LinksManager/CellEditingDialog'
import * as Styled from '../MarkdownEditor.styled'

// estimated space the menu needs, used to decide if it opens above or below the caret
const MENU_HEIGHT = 240

interface SuggestionMenuProps<TOption extends MenuOption> {
  editor: LexicalEditor
  // the typeahead anchor at the caret
  anchor: HTMLElement
  // inline: at the caret, top: across the top of the editor
  placement: MentionPlacement
  // no title hides the title bar
  title?: ReactNode
  // e.g. filter buttons on the right of the title
  titleActions?: ReactNode
  // options of different groups are separated by a divider
  getGroup?: (option: TOption) => string | undefined
  options: TOption[]
  selectedIndex: number | null
  onSelect: (option: TOption) => void
  onHighlight: (index: number) => void
  renderOption: (option: TOption) => ReactNode
  optionClassName?: (option: TOption) => string | undefined
  // shown when there are no options
  emptyMessage?: string | null
  className?: string
}

/**
 * The suggestions list shared by the typeahead plugins (mentions, emoji), rendered from their
 * `menuRenderFn`. Keyboard navigation is handled by the typeahead plugin.
 */
const SuggestionMenu = <TOption extends MenuOption>({
  editor,
  anchor,
  placement,
  title,
  titleActions,
  options,
  selectedIndex,
  onSelect,
  onHighlight,
  renderOption,
  optionClassName,
  emptyMessage,
  className,
  getGroup,
}: SuggestionMenuProps<TOption>) => {
  const listRef = useRef<HTMLUListElement>(null)

  // keep the option picked with the arrow keys in view
  useLayoutEffect(() => {
    const list = listRef.current
    const selected = list?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!list || !selected) return
    const top = selected.offsetTop
    const bottom = top + selected.offsetHeight
    if (top < list.scrollTop) list.scrollTop = top - 4
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight + 4
    }
  }, [selectedIndex])

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
      className={clsx('mention-menu md-popover', BLOCK_DIALOG_CLOSE_CLASS, className, {
        above: openAbove,
        top: isTop,
      })}
      // keep focus in the editor when clicking the menu
      onMouseDown={(e) => e.preventDefault()}
    >
      {(title || titleActions) && (
        <Styled.MentionMenuTitle>
          <span>{title}</span>
          {titleActions}
        </Styled.MentionMenuTitle>
      )}
      <ul ref={listRef} role="listbox" className={clsx({ untitled: !title && !titleActions })}>
        {options.map((option, i) => [
          i > 0 && getGroup && getGroup(option) !== getGroup(options[i - 1]) && (
            <Styled.MentionMenuDivider key={`divider-${option.key}`} role="separator" />
          ),
          <Styled.MentionMenuItem
            key={option.key}
            ref={(el) => option.setRefElement(el)}
            role="option"
            aria-selected={selectedIndex === i}
            className={clsx(optionClassName?.(option), { selected: selectedIndex === i })}
            onMouseEnter={() => onHighlight(i)}
            onClick={() => {
              onHighlight(i)
              onSelect(option)
            }}
          >
            {renderOption(option)}
          </Styled.MentionMenuItem>,
        ])}
        {!options.length && emptyMessage && (
          <Styled.MentionMenuItem className="empty">{emptyMessage}</Styled.MentionMenuItem>
        )}
      </ul>
    </Styled.MentionMenu>,
    target,
  )
}

export default SuggestionMenu
