import { useState, useEffect } from 'react'
import axios from 'axios'

import SettingsEditor from '../../containers/settingsEditor/'

const SystemSettings = () => {

  const [schema, setSchema] = useState(null)
  const [formData, setFormData] = useState(null)

  useEffect(() => {
    axios
      .get('/api/settings/schema')
      .then(res => { setSchema(res.data) })
  }, [])

  useEffect(() => {
    axios
      .get('/api/settings/system')
      .then(res => { setFormData(res.data) })
  }, [])

  if (!schema || !formData) return <main>Loading...</main>

  const onChange = (formData) => {
    
  }

  return (
    <main>
      <section style={{flexGrow: 1, maxWidth: 1200}}>
          <div className="wrapper" style={{ overflowY: 'scroll'}}>
            <SettingsEditor schema={schema} formData={formData} onChange={onChange}/>
          </div>
      </section>
    </main>
  )
}

export default SystemSettings
