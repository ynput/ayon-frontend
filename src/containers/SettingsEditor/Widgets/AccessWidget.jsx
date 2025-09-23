import { toast } from 'react-toastify'
import {useState, useEffect} from 'react'
import { updateChangedKeys, parseContext, getDefaultValue } from '../helpers'
import CodeEditor from '@uiw/react-textarea-code-editor'
import {CodeEditorWrapper} from '../styledComponents'

function AccessWidget(props) {
  const { path } = parseContext(props)

  const [value, setValue] = useState(props.formData || {})

  const [textValue, setTextValue] = useState('{}')
  const [status, setStatus] = useState('unchanged')

  useEffect(() => {
    setTextValue(JSON.stringify(props.formData || {}, null, 2))
  }, [value])
  

  const onCommit = () => {
    let commitValue = {}
    try {
     commitValue = JSON.parse(textValue)
    } catch (e) {
      toast.error("Invalid JSON")
      setStatus('error')
      return
    }

    const isChanged = commitValue !== value
    setValue(commitValue)
    props.onChange(commitValue)

    setTimeout(() => {
      updateChangedKeys(props, isChanged, path)
      setStatus('unchanged')
    }, 100)
  }


  return (
    <>
      <CodeEditorWrapper className={status}>
        <CodeEditor
            wrap = "false"
            value={textValue}
            language = "json"
            onChange={(e) => {
              setTextValue(e.target.value)
              setStatus('changed')
          }}
            onBlur={onCommit}
        />
      </CodeEditorWrapper>
    </>
  )
}

export default AccessWidget


