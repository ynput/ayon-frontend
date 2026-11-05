import type { KeyboardEvent } from 'react'

/**
 * Enter without modifiers that should confirm a dialog. Not when Enter already means something
 * else: a newline in a multiline field, clicking a focused button or link, picking in a select or
 * an open dropdown (they call preventDefault), or IME composition.
 */
export const isDialogConfirmKey = (e: KeyboardEvent<HTMLElement>): boolean => {
  if (e.key !== 'Enter' || e.defaultPrevented || e.nativeEvent.isComposing) return false
  if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return false
  const target = e.target as HTMLElement
  if (target.isContentEditable) return false
  return !target.closest('textarea, button, a[href], select, [role="button"], [role="listbox"]')
}

type DialogKeyDownOptions = {
  /** called on Escape: a Dialog given onKeyDown leaves Escape to it */
  onClose?: () => void
  /** the primary action is disabled (invalid input, saving): Enter does nothing */
  disabled?: boolean
}

/**
 * onKeyDown for a Dialog: Enter runs the primary action, the same as clicking its button.
 * Use it for form and confirmation dialogs whose action is not destructive; destructive ones
 * confirm only through their focused button.
 */
export const getDialogKeyDown =
  (onConfirm: () => void, { onClose, disabled }: DialogKeyDownOptions = {}) =>
  (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      // a child that used Escape (closing an open date picker or dropdown) keeps the dialog open
      if (!e.defaultPrevented) onClose?.()
      return
    }
    if (disabled || !isDialogConfirmKey(e)) return
    e.preventDefault()
    onConfirm()
  }
