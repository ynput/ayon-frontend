import { ReactNode, useLayoutEffect, useMemo, useRef } from 'react'
import clsx from 'clsx'
import { hasTemplateKeys, splitTemplateKeys } from './templateKeys'

type SettingsTemplateTextProps = {
  value: string
  /** The text input */
  children: ReactNode
}

/**
 * Colours the template keys of a text input in the flat layout. An input can't style
 * parts of its text, so a coloured copy is drawn over it, matching its font and insets,
 * and the input's own text turns transparent (its caret and selection stay). The copy
 * follows the input's horizontal scroll. Always rendered, so typing the first key
 * doesn't remount the input.
 */
export const SettingsTemplateText = ({ value, children }: SettingsTemplateTextProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const parts = useMemo(() => splitTemplateKeys(value || ''), [value])
  const hasKeys = hasTemplateKeys(parts)

  // the copy takes the input's text metrics, which differ between rows, boxes and lists
  useLayoutEffect(() => {
    const input = wrapperRef.current?.querySelector('input')
    const mirror = mirrorRef.current
    if (!hasKeys || !input || !mirror) return
    const style = getComputedStyle(input)
    mirror.style.font = style.font
    mirror.style.letterSpacing = style.letterSpacing
    mirror.style.paddingLeft = `calc(${style.paddingLeft} + ${style.borderLeftWidth})`
    mirror.style.paddingRight = `calc(${style.paddingRight} + ${style.borderRightWidth})`
    mirror.scrollLeft = input.scrollLeft
  }, [hasKeys])

  // read once the browser has moved the text (it scrolls back to the start on blur)
  const syncScroll = () =>
    requestAnimationFrame(() => {
      const input = wrapperRef.current?.querySelector('input')
      if (input && mirrorRef.current) mirrorRef.current.scrollLeft = input.scrollLeft
    })

  return (
    <div
      ref={wrapperRef}
      className={clsx('settings-template-text', hasKeys && 'has-keys')}
      onScrollCapture={syncScroll}
      onInputCapture={syncScroll}
      onKeyUpCapture={syncScroll}
      onBlurCapture={syncScroll}
    >
      {children}
      {hasKeys && (
        <div ref={mirrorRef} className="settings-template-text-mirror" aria-hidden>
          {parts.map((part) => (
            <span key={part.start} className={`template-${part.kind}`}>
              {part.text}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
