import { FocusEvent, ReactNode, useState } from 'react'
import clsx from 'clsx'

type SettingsTextFoldProps = {
  /** The value differs from the saved one: the field stays open until saved or cleared */
  changed: boolean
  children: ReactNode
}

/**
 * A text area or code editor folded to one line in the flat layout, as tall as a text
 * input. Hovering previews the whole value over the rows below; focusing opens it in
 * place, and it stays open while it holds an unsaved edit.
 */
export const SettingsTextFold = ({ changed, children }: SettingsTextFoldProps) => {
  const [focused, setFocused] = useState(false)
  const open = focused || changed

  // focus moving inside the field (the code editor's own elements) keeps it open
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
  }

  return (
    <div
      className={clsx('settings-text-fold', open ? 'is-open' : 'is-folded')}
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
    >
      <div className="settings-text-fold-box">{children}</div>
    </div>
  )
}
