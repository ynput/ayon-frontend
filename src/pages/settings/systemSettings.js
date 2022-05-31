import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

import { Button, Spacer } from '../../components'
import { toast } from 'react-toastify'
import SettingsEditor from '../../containers/settingsEditor/'


const SystemSettings = () => {
  const [schema, setSchema] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [overrides, setOverrides] = useState(null)
  const [newData, setNewData] = useState(null)


  const loadSchema = () => {
    axios.get('/api/settings/system/schema')
      .then(res => setSchema(res.data))
      .catch(err => console.log(err))
  }

  const loadSettings = () => {
    axios
      .get('/api/settings/system')
      .then(res => {
        setOriginalData(res.data)
        setNewData(null)
      })
      .catch(err => console.log(err))

    axios
      .get('/api/settings/system/overrides')
      .then(res => setOverrides(res.data))
  }


  useEffect(() => {
    loadSchema()
    loadSettings()
  }, [])

  const onChange = (formData) => {
 //   console.log(formData)
    setNewData(formData)
  }

  const onSave = () => {
    axios
      .put('/api/settings/system', newData)
      .then(() => loadSettings())
      .catch(() => toast.error("Unable to save settings. Check the form for errors."))
  }

  const onDelete = () => {
    axios
      .delete('/api/settings/system')
      .then(() => loadSettings())
  }


  const editor = useMemo(() => {
    /*
      * The editor is only rendered if the schema and original data are loaded
      * and the new data is different from the original data.
      * It is memoized, so re-reder is not triggered when newData is updated.
      * */
    if (!(schema && originalData && overrides))
       return "Loading editor.."
    console.log("Rendering editor")
    return <SettingsEditor schema={schema} formData={originalData} overrides={overrides} onChange={onChange}/>
  }, [schema, originalData, overrides])

  return (
    <main>
      <section className="invisible" style={{ flexGrow: 1}}>
      <section className="invisible row">
          <Button
            label="Save settings"
            icon="check"
            onClick={onSave}
            disabled={!newData}
          />
          <Button
            label="Delete studio overrides"
            icon="cancel"
            onClick={onDelete}
          />
      </section>
      <section className="invisible" style={{flexGrow: 1}}>
          <div className="wrapper" style={{ overflowY: 'scroll', flexGrow: 2, maxWidth: 1200, margin: "0 auto"}}>
            {editor}
          </div>
      </section>
      </section>
    </main>
  )
}

export default SystemSettings
