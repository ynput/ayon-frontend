import { useState, useEffect, useRef } from 'react'
import { InputText } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const Timescode = styled(InputText)`
  &:disabled {
    opacity: 1;
    cursor: default;
    border-color: var(--md-sys-color-surface-container-low);
  }
`

const Timecode = ({ value, onChange, maximum, disabled, tooltip, offset = 0 }) => {
  const [frames, setFrames] = useState(offset)
  const inputRef = useRef()

  useEffect(() => {
    if (isNaN(value)) return
    setFrames(value)
  }, [value])

  const submit = () => {
    if (!onChange || isNaN(frames) || maximum < frames || frames < 0) {
      setFrames(value)
      return
    }
    onChange(frames)
    inputRef.current.blur()
  }

  return (
    <Timescode
      ref={inputRef}
      value={frames + offset}
      style={{ width: '100px', fontFamily: 'monospace' }}
      onChange={(e) => setFrames(e.target.value - offset)}
      onBlur={submit}
      type="number"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          submit()
        }
        e.stopPropagation()
      }}
      readOnly={!onChange}
      disabled={disabled}
      data-tooltip={tooltip}
    />
  )
}

export default Timecode
