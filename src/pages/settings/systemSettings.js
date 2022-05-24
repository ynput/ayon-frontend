import { useState, useEffect } from 'react'
import axios from 'axios'

import SettingsEditor from '../../containers/settingsEditor/'




const SystemSettings = () => {
  const [schema, setSchema] = useState(null)
  const [formData, setFormData] = useState(null)

  useEffect(() => {
    console.log("Requesting schema")
    axios
      .get('/api/settings/schema')
      .then(res => { setSchema(res.data) })
  }, [])


  


  useEffect(() => {
    console.log("Requesting settings")
    axios
      .get('/api/settings/system')
      .then(res => { 
      //  const data = res.data
      //  applyOverrides(data, siteOverrides, "studio")
      //  console.log("initial form data", data)
        setFormData(res.data) 
      })
  }, [])




  if (!schema)
     return <main>Loading schema...</main>
  if (!formData) 
     return <main>Loading data...</main>

  console.log(schema, formData)

  const onChange = (formData) => {
    
  }

  return (
    <main>
      <section style={{flexGrow: 1}}>
          <div className="wrapper" style={{ overflowY: 'scroll'}}>
            <SettingsEditor schema={schema} formData={formData} onChange={onChange}/>
          </div>
      </section>
    </main>
  )
}

export default SystemSettings
