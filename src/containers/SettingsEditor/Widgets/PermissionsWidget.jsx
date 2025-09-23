import {useState} from 'react'
import { updateChangedKeys, parseContext, getDefaultValue } from '../helpers'
import CodeEditor from '@uiw/react-textarea-code-editor'

function PermissionsWidget(props) {
  const { originalValue, path } = parseContext(props)
  const [textValue, setTextValue] = useState(JSON.stringify(originalValue || {}, null, 2) || '{}')

  


  const onCommit = () => {
    let commitValue = JSON.parse(textValue)


    const isChanged = commitValue !== originalValue
    props.onChange(commitValue)
    setTimeout(() => {
      updateChangedKeys(props, isChanged, path)
    }, 100)
  }


  return (
    <>
      <CodeEditor
          wrap = "false"
          value={textValue}
          language = "json"
          onChange={(e) => {setTextValue(e.target.value)}}
      />

    <button onClick={onCommit}>Save</button>

    </>
  )
}

export default PermissionsWidget


