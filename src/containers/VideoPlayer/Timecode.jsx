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

const Timecode = ({ value, frameRate, onChange, maximum, disabled, tooltip, offset = 0 }) => {
  const [frames, setFrames] = useState(offset)
  const inputRef = useRef()

  useEffect(() => {
    const val = Math.floor(value * frameRate)
    if (val === frames) return
    if (isNaN(val)) return
    setFrames(val)
  }, [value, frameRate])

  const submit = () => {
    if (!onChange) return
    if (isNaN(frames)) return
    if (frames < 0) return
    const seconds = frames / frameRate
    if (maximum && seconds >= maximum) return
    onChange(seconds)
    inputRef.current.blur()
  }

  return (
    <Timescode
      ref={inputRef}
      value={frames + offset}
      style={{ width: '100px', fontFamily: 'monospace' }}
      onChange={(e) => setFrames(e.target.value - offset)}
      onBlur={submit}
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
