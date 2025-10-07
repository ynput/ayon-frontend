import axios from 'axios'
import styled from 'styled-components'

import { toast } from 'react-toastify'
import { useState, useEffect, useMemo } from 'react'
import { updateChangedKeys, parseContext, getDefaultValue } from '../helpers'
import CodeEditor from '@uiw/react-textarea-code-editor'
import { CodeEditorWrapper } from '../SettingsEditor.styled'
import { Button, Dialog } from '@ynput/ayon-react-components'


const ShareOption = styled.div`
  background:  #434a56;
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const ShareOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
`




const AccessEditorDialog = ({ initialValue, onSubmit, projectName }) => {

  const [shareOptions, setShareOptions] = useState([])
  const [values, setValues] = useState(initialValue || {})

  useEffect(() => {
    const fetchShareOptions = async () => {
      try {
        const response = await axios.get('/api/share', {params: { project_name: projectName }})
        const result = [
          { label: 'Internal users', value: '__everyone__', 'shareType': 'global' },
          { label: 'Guest users', value: '__guests__', 'shareType': 'global' },
        ]
        for (const option of response.data.options) {
          result.push({ label: option.label, value: option.value, shareType: option.shareType })
        }

        setShareOptions(result)
      } catch (error) {
        console.error('Error fetching share options:', error)
        toast.error('Failed to fetch share options')
      }
    }

    fetchShareOptions()
  }, [projectName])
  

  const footer = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: 'row' }}>
      <Button onClick={() => onSubmit(values)} label="Submit" />
      <Button onClick={() => onSubmit(null)} label="Cancel" />
    </div>
  )

  return (
    <Dialog
      header="Edit Access"
      footer={footer}
      isOpen
      size="lg"
      onClose={() => onSubmit(null)}
      style={{ width: '600px', height: '600px' }}
    >
      <ShareOptionsContainer>
      {shareOptions.map((option) => (
        <ShareOption key={option.value}>
            {option.label} ({option.shareType})
            <input
              type="checkbox"
              checked={values[option.value] > 0}
              onChange={(e) => {
                const newValue = { ...values, [option.value]: e.target.checked ? 10 : undefined }
                console.log(newValue)
                setValues(newValue)
              }}
            />
        </ShareOption>
      ))}
      </ShareOptionsContainer>
    </Dialog>
  )
}




const AccessWidget = (props) => {
  const { path } = parseContext(props)
  const projectName = props?.formContext?.headerProjectName

  const [value, setValue] = useState(props.formData || {})
  const [isOpen, setIsOpen] = useState(false)

  const onDialogSubmit = (commitValue) => {
    console.log("Dialog submitted with value:", commitValue)
    if (commitValue === null) {
      setIsOpen(false)
      return
    }

    const isChanged = commitValue !== value
    setValue(commitValue)
    props.onChange(commitValue)
    setTimeout(() => {
      updateChangedKeys(props, isChanged, path)
      setStatus('unchanged')
    }, 100)
    setIsOpen(false)
  }


  const dialogComponent = useMemo(() => {
    if (!isOpen) return
    return (
      <AccessEditorDialog 
        projectName={projectName}
        initialValue={value} 
        onSubmit={onDialogSubmit} 
      />
    )
  }, [value, isOpen, projectName])


  return (
    <>
      <Button 
        onClick={() => { 
          setIsOpen(true); 
          console.log("Opening access editor") 
        }}
        label="Edit Access"
        icon="lock"
      />
      {dialogComponent}
    </>
  )
}


/*  
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
          wrap="false"
          value={textValue}
          language="json"
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
*/
export default AccessWidget


