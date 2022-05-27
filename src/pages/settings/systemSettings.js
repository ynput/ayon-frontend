import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

import { Button } from '../../components'
import SettingsEditor from '../../containers/settingsEditor/'
import { deepCopy } from '../../utils'
import { isEqual } from 'lodash'
import { toast } from 'react-toastify'


const patch = (data, overrides, root) => {
  let hasChanges = false
  for (const key in data){
    const path = `${root}_${key}`
    const override = overrides[path]

    if (override && override.level === 'default'){
      if (isEqual(override.value, data[key])){
        // no change. remove from patch
        delete data[key]
        continue
      }
    } 
      
    if (typeof data[key] === 'object' && Array.isArray(data[key]) === false){
      if (override && override.type === 'group')
        hasChanges = true
      else {
        if (patch(data[key], overrides, path))
          hasChanges = true
        else
          delete data[key]
      }
    } 
    else 
      hasChanges = true
  }
  return hasChanges
}


const createPatch = (data, overrides) => {
  const r = deepCopy(data)
  patch(r, overrides, "root")
  return r
}



const SystemSettings = () => {
  const [schema, setSchema] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [overrides, setOverrides] = useState(null)
  const [newData, setNewData] = useState(null)


  const loadSchema = () => {
    axios.get('/api/settings/schema')
      .then(res => setSchema(res.data))
      .catch(err => console.log(err))
  }

  const loadSettings = () => {
    axios
      .get('/api/settings/system')//?verbose=true')
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
    const patchData = createPatch(newData, overrides)
    axios
      .patch('/api/settings/system', patchData)
      .then(() => loadSettings())
      .catch(err => toast.error("Unable to save settings. Check the form for errors."))
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
      <section style={{flexGrow: 1}}>
          <div className="wrapper" style={{ overflowY: 'scroll'}}>
            {editor}
          </div>
      </section>
      </section>
    </main>
  )
}

export default SystemSettings
