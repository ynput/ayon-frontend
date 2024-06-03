import {useState, useEffect, useRef} from 'react'
import {InputText} from '@ynput/ayon-react-components'

const Timecode = ({ value, frameRate, onChange, maximum}) => {
  const [frames, setFrames] = useState(0)
  const inputRef = useRef()

  useEffect(() => {
    setFrames(Math.floor(value * frameRate))
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
    <InputText
      ref={inputRef}
      value={frames}
      style={{width: '100px', fontFamily: 'monospace'}}
      onChange={(e) => setFrames(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          submit()
        }
        e.stopPropagation()
      }}
      readOnly={!onChange}
    />
  )
}

export default Timecode
