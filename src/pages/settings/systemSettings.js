import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

import SettingsEditor from '../../containers/settingsEditor/'


const SystemSettings = () => {
  const [schema, setSchema] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [newData, setNewData] = useState(null)

  useEffect(() => {
    axios
      .get('/api/settings/schema')
      .then(res => setSchema(res.data))
  }, [])


  useEffect(() => {
    axios
      .get('/api/settings/system')
      .then(res => setOriginalData(res.data))
  }, [])

  const onChange = (formData) => {
    console.log(formData)
    setNewData(formData)
  }

  const editor = useMemo(() => {
    if (!(schema && originalData))
       return "Loading editor.."
    return <SettingsEditor schema={schema} formData={originalData} onChange={onChange}/>
  }, [schema, originalData])

  return (
    <main>
      <section style={{flexGrow: 1}}>
          <div className="wrapper" style={{ overflowY: 'scroll'}}>
            {editor}
          </div>
      </section>
    </main>
  )
}

export default SystemSettings
