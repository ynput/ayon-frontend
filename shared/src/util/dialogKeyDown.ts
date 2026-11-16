import type { KeyboardEvent } from 'react'
import { getPlatformShortcutKey, KeyMode } from './platform'

// elements that handle Enter themselves: a focused button, link or action input clicks itself,
// a picker input opens its picker, a multiline field adds a newline
const HANDLES_ENTER =
  'textarea, button, a[href], select, [role="button"], [role="listbox"], ' +
  'input:is([type="button"], [type="submit"], [type="reset"], [type="image"], [type="color"], [type="file"])'

/**
 * Enter on a field of this dialog, where Enter does not already mean something else: a newline in
 * a multiline field, clicking a focused button, link or action input, opening a picker input,
 * picking in a select or an open dropdown (they call preventDefault), or IME composition. Not from
 * a dialog portalled out of this one either: React events bubble through portals, so Enter in a
 * nested dialog would otherwise confirm its parent.
 */
const isEnterOnField = (e: KeyboardEvent<HTMLElement>): boolean => {
  if (e.key !== 'Enter' || e.defaultPrevented || e.nativeEvent.isComposing) return false
  if (e.ctrlKey || e.metaKey || e.altKey) return false
  const target = e.target as HTMLElement
  if (!e.currentTarget.contains(target)) return false
  if (target.isContentEditable) return false
  return !target.closest(HANDLES_ENTER)
}

/** Enter without modifiers that should confirm a dialog */
export const isDialogConfirmKey = (e: KeyboardEvent<HTMLElement>): boolean =>
  !e.shiftKey && isEnterOnField(e)

/** Shift+Enter that should confirm a create dialog and keep it open for the next item */
export const isDialogContinueKey = (e: KeyboardEvent<HTMLElement>): boolean =>
  e.shiftKey && isEnterOnField(e)

type DialogKeyDownOptions = {
  /** called on Escape: a Dialog given onKeyDown leaves Escape to it */
  onClose?: () => void
  /** the primary action is disabled (invalid input, saving): Enter does nothing */
  disabled?: boolean
  /** Shift+Enter: run the primary action and keep the dialog open to create another */
  onContinue?: () => void
}

/**
 * onKeyDown for a Dialog: Enter runs the primary action, the same as clicking its button.
 * Use it for form and confirmation dialogs whose action is not destructive; destructive ones
 * confirm only through their focused button.
 */
export const getDialogKeyDown =
  (onConfirm: () => void, { onClose, disabled, onContinue }: DialogKeyDownOptions = {}) =>
  (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      // a child that used Escape (closing an open date picker or dropdown) keeps the dialog open
      if (!e.defaultPrevented) onClose?.()
      return
    }
    if (disabled) return
    if (isDialogConfirmKey(e)) {
      e.preventDefault()
      onConfirm()
    } else if (onContinue && isDialogContinueKey(e)) {
      e.preventDefault()
      onContinue()
    }
  }

/** Tooltip props for the create button of a dialog that supports Shift+Enter */
export const getCreateAnotherTooltip = () => ({
  'data-tooltip': `${getPlatformShortcutKey('Enter', [KeyMode.Shift])} to create another`,
  'data-shortcut': 'Enter',
})
