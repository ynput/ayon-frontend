import type { ReactNode } from 'react'
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
  title: ReactNode
  // e.g. filter buttons on the right of the title
  titleActions?: ReactNode
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
}: SuggestionMenuProps<TOption>) => {
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
      <Styled.MentionMenuTitle>
        <span>{title}</span>
        {titleActions}
      </Styled.MentionMenuTitle>
      <ul role="listbox">
        {options.map((option, i) => (
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
          </Styled.MentionMenuItem>
        ))}
        {!options.length && emptyMessage && (
          <Styled.MentionMenuItem className="empty">{emptyMessage}</Styled.MentionMenuItem>
        )}
      </ul>
    </Styled.MentionMenu>,
    target,
  )
}

export default SuggestionMenu
