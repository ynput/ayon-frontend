import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import clsx from 'clsx'
import { hasTemplateKeys, splitTemplateKeys } from './templateKeys'
import { TextExpansion, getTextExpansion, isSameExpansion } from './settingsTextExpandHelpers'

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
 *
 * A value that doesn't fit opens in full while the field is hovered or focused: the field
 * grows over its neighbours, inside its row's box, and the row keeps the room it had, so
 * nothing moves.
 */
export const SettingsTemplateText = ({ value, children }: SettingsTemplateTextProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  // most values hold no key: only one with a brace is worth splitting
  const parts = useMemo(() => (value?.includes('{') ? splitTemplateKeys(value) : []), [value])
  const hasKeys = hasTemplateKeys(parts)
  const [expansion, setExpansion] = useState<TextExpansion | null>(null)
  const pointer = useRef({ hovered: false, focused: false })

  // the copy takes the input's text metrics, which differ between rows, boxes and lists
  useLayoutEffect(() => {
    const input = wrapperRef.current?.querySelector('input')
    const mirror = mirrorRef.current
    if (!hasKeys || !input || !mirror) return
    const style = getComputedStyle(input)
    mirror.style.fontFamily = style.fontFamily
    mirror.style.fontSize = style.fontSize
    mirror.style.fontWeight = style.fontWeight
    mirror.style.fontStyle = style.fontStyle
    mirror.style.letterSpacing = style.letterSpacing
    mirror.style.paddingLeft = `calc(${style.paddingLeft} + ${style.borderLeftWidth})`
    mirror.style.paddingRight = `calc(${style.paddingRight} + ${style.borderRightWidth})`
    mirror.scrollLeft = input.scrollLeft
  }, [hasKeys])

  // read once the browser has moved the text (it scrolls back to the start on blur)
  const syncScroll = () => {
    if (!hasKeys) return
    requestAnimationFrame(() => {
      const input = wrapperRef.current?.querySelector('input')
      if (input && mirrorRef.current) mirrorRef.current.scrollLeft = input.scrollLeft
    })
  }

  const refresh = useCallback(() => {
    const wrapper = wrapperRef.current
    const input = wrapper?.querySelector('input')
    const next =
      wrapper && input && (pointer.current.hovered || pointer.current.focused)
        ? getTextExpansion(wrapper, input)
        : null
    setExpansion((prev) => (isSameExpansion(prev, next) ? prev : next))
  }, [])

  // typing changes how much room the value needs
  useEffect(() => {
    if (pointer.current.focused) refresh()
  }, [value, refresh])

  const track = (key: 'hovered' | 'focused', on: boolean) => {
    pointer.current[key] = on
    refresh()
  }

  return (
    <div
      ref={wrapperRef}
      className={clsx('settings-template-text', hasKeys && 'has-keys', expansion && 'is-expanded')}
      style={expansion ? { height: expansion.height } : undefined}
      onMouseEnter={() => track('hovered', true)}
      onMouseLeave={() => track('hovered', false)}
      onFocusCapture={() => track('focused', true)}
      onBlurCapture={() => {
        syncScroll()
        track('focused', false)
      }}
      onScrollCapture={syncScroll}
      onInputCapture={syncScroll}
      onKeyUpCapture={syncScroll}
    >
      <div
        className="settings-template-text-box"
        style={expansion ? { width: expansion.width, left: expansion.left } : undefined}
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
    </div>
  )
}
