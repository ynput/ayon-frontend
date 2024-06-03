import {InputText} from '@ynput/ayon-react-components'

const Timecode = ({ value, frameRate }) => {
  
  // TODO: switchable to SMPTETimecode
  
  const frames = Math.floor(value * frameRate)

  return (
    <InputText
      value={frames}
      style={{width: '100px', fontFamily: 'monospace'}}
      readOnly
    />
  )

}

export default Timecode
