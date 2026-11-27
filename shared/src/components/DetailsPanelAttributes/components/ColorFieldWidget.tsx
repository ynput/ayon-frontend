import { FC, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Button, ColorPicker } from '@ynput/ayon-react-components'

const Value = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  .swatch-dot {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid var(--md-sys-color-outline-variant);
  }
  .placeholder {
    color: var(--md-sys-color-outline);
  }
`

const Editing = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  padding: 4px 0;

  /* the row's size: smaller swatches, over two lines when narrow */
  .color-picker {
    flex-wrap: wrap;
    gap: 6px;
  }
  .swatch {
    width: 20px;
    height: 20px;
  }
`

interface ColorFieldWidgetProps {
  value?: string
  isEditing?: boolean
  placeholder: string
  /** the colour chosen; '' for none */
  onChange: (value: string) => void
  onCancelEdit?: () => void
}

/**
 * A colour field (`widget: 'color'`): its swatch and code, and while editing the suggested colours,
 * any other from the browser's picker, and none. A suggested colour or none is chosen at once; the
 * browser's picker is chosen when it closes (dragging in it only previews). Escape, or a click
 * elsewhere, keeps the colour as it was, unless the picker changed it.
 */
const ColorFieldWidget: FC<ColorFieldWidgetProps> = ({
  value,
  isEditing,
  placeholder,
  onChange,
  onCancelEdit,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value, isEditing])

  // the latest of each, for the listeners below; one choice per edit
  const latest = useRef({ value, draft, onChange, onCancelEdit })
  latest.current = { value, draft, onChange, onCancelEdit }
  const done = useRef(false)

  useEffect(() => {
    if (!isEditing) return
    done.current = false
    const choose = (colour: string) => {
      if (done.current) return
      done.current = true
      latest.current.onChange(colour)
    }
    const leave = () => {
      const { value, draft, onCancelEdit } = latest.current
      if (draft !== value) choose(draft ?? '')
      else if (!done.current) {
        done.current = true
        onCancelEdit?.()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) leave()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        done.current = true
        latest.current.onCancelEdit?.()
      } else if (event.key === 'Enter') leave()
    }
    // the browser's picker reports its colour as it closes (a native change, which bubbles)
    const onNativeChange = (event: Event) => {
      const input = event.target as HTMLInputElement
      if (input.type === 'color') choose(input.value)
    }
    const element = ref.current
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    element?.addEventListener('change', onNativeChange)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
      element?.removeEventListener('change', onNativeChange)
    }
  }, [isEditing])

  if (!isEditing)
    return (
      <Value>
        {value ? (
          <>
            <span className="swatch-dot" style={{ backgroundColor: value }} />
            {value}
          </>
        ) : (
          <span className="placeholder">{placeholder}</span>
        )}
      </Value>
    )

  return (
    // its own clicks: the row's would cancel the one opening the browser's picker
    <Editing ref={ref} onClick={(event) => event.stopPropagation()}>
      <ColorPicker
        value={draft}
        onChange={(colour) => {
          setDraft(colour)
          // a suggested colour is chosen at once; the browser's picker only previews until it closes
          if ((document.activeElement as HTMLInputElement | null)?.type !== 'color') {
            done.current = true
            onChange(colour)
          }
        }}
      />
      {value && (
        <Button
          variant="text"
          icon="close"
          data-tooltip="No colour"
          aria-label="No colour"
          onClick={() => {
            done.current = true
            onChange('')
          }}
        />
      )}
    </Editing>
  )
}

export default ColorFieldWidget
