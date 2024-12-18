import { useState, useEffect } from 'react'
import axios from 'axios'

import SettingsEditor from '@containers/SettingsEditor'

import {
  Button,
  Spacer,
  Section,
  Panel,
  Toolbar,
  ScrollPanel,
  SaveButton,
} from '@ynput/ayon-react-components'

const ServerConfig = () => {
  // Replace with RTK from here....

  const [originalData, setOriginalData] = useState(null)
  const [configOverrides, setConfigOverrides] = useState(null)
  const [configSchema, setConfigSchema] = useState(null)

  const loadConfig = () => {
    axios
      .get('/api/config/schema')
      .then((response) => {
        setConfigSchema(response.data)
      })
      .catch(console.error)

    axios
      .get('/api/config')
      .then((response) => {
        setOriginalData(response.data)
      })
      .catch(console.error)
    axios
      .get('/api/config/overrides')
      .then((response) => {
        setConfigOverrides(response.data)
      })
      .catch(console.error)
  }

  useEffect(() => {loadConfig()}, [])

  // ... to here

  const [formData, setFormData] = useState(null)

  useEffect(() => {
    if (!originalData || !configSchema || !configOverrides) return
    setFormData(originalData)
    setChangedKeys([])
  }, [originalData, configSchema, configOverrides])

  const [changedKeys, setChangedKeys] = useState([])

  const onSave = () => {
    axios
      .post('/api/config', formData)
      .then(() => {
        loadConfig()
      })
      .catch((error) => {
        console.error(error)
      })
  }

  return (
    <main style={{ flexDirection: 'column' }}>
      <Toolbar>
        <Spacer />
        <SaveButton 
          active={changedKeys.length} 
          onClick={onSave} 
          label="Save server config"
        />
      </Toolbar>
      <Section>
        <ScrollPanel style={{ flexGrow: 1, padding:8 }} className="transparent">
          <SettingsEditor
            schema={configSchema}
            originalData={originalData}
            formData={formData}
            changedKeys={changedKeys}
            overrides={configOverrides}
            onChange={setFormData}
            onSetChangedKeys={setChangedKeys}
          />
        </ScrollPanel>
      </Section>
    </main>
  )

  /*
  
        onSetBreadcrumbs={onSetBreadcrumbs}
        breadcrumbs={breadcrumbs}
        context={context}
  */
}

export default ServerConfig
