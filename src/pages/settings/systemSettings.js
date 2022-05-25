import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

import { Button } from '../../components'
import SettingsEditor from '../../containers/settingsEditor/'
import { deepCopy } from '../../utils'


const patch = (data, inGroup=false) => {
  const overrides = data.__overrides__ 
  let hasChanges = false
  for (const key in data) {
    if (key === '__overrides__')
      continue
    
    if (typeof data[key] === 'object') {
      if (!Array.isArray(data[key])) {
        const ig = inGroup || (overrides[key] && overrides[key].type === 'group')
        if (!patch(data[key], ig)){
          delete data[key]
        } else {
          hasChanges = true
        }
        continue
      }
    }

    if (overrides[key].changed || inGroup || overrides[key].level !== 'default'){ 
      hasChanges = true
    }
    else
       delete data[key]
  }
  delete data.__overrides__
  return hasChanges
}


const createPatch = (data) => {
  const r = deepCopy(data)
  patch(r)
  return r
}




const SystemSettings = () => {
  const [schema, setSchema] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [newData, setNewData] = useState(null)


  const loadSchema = () => {
    axios.get('/api/settings/schema')
      .then(res => setSchema(res.data))
      .catch(err => console.log(err))
  }

  const loadSettings = () => {
    axios
      .get('/api/settings/system?verbose=true')
      .then(res => {
        setOriginalData(res.data)
        setNewData(null)
      })
      .catch(err => console.log(err))
  }

  useEffect(() => {
    loadSchema()
    loadSettings()
  }, [])

  const onChange = (formData) => {
    console.log(formData)
    setNewData(formData)
  }

  const onSave = () => {
    const patchData = createPatch(newData)
    console.log(patchData)
    axios
      .patch('/api/settings/system', patchData)
      .then(() => loadSettings())
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
    if (!(schema && originalData))
       return "Loading editor.."
    return <SettingsEditor schema={schema} formData={originalData} onChange={onChange}/>
  }, [schema, originalData])

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
