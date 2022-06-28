import axios from 'axios'
import { useState, useMemo, useEffect } from 'react'

import SettingsEditor from '/src/containers/settingsEditor'

const SettingsPanel = ({
  addon,
  onChange,
  onSetChangedKeys,
  localData,
  changedKeys,
  reloadTrigger,
}) => {
  const [schema, setSchema] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [overrides, setOverrides] = useState(null)

  const loadSchema = () => {
    axios
      .get(`/api/addons/${addon.name}/${addon.version}/schema`)
      .then((res) => setSchema(res.data))
      .catch((err) => console.log(err))
  }

  const loadSettings = () => {
    if (localData) {
      setOriginalData(localData)
    } else {
      axios
        .get(`/api/addons/${addon.name}/${addon.version}/settings`)
        .then((res) => {
          setOriginalData(res.data)
          //setNewData(null)
        })
        .catch((err) => console.log(err))
    }

    axios
      .get(`/api/addons/${addon.name}/${addon.version}/overrides`)
      .then((res) => setOverrides(res.data))
  }

  useEffect(() => {
    loadSchema()
    loadSettings()
  }, [addon.name, addon.version, reloadTrigger])

  const editor = useMemo(() => {
    if (!(schema && originalData && overrides)) return <></>
    return (
      <SettingsEditor
        schema={schema}
        formData={originalData}
        changedKeys={changedKeys}
        overrides={overrides}
        onChange={onChange}
        onSetChangedKeys={onSetChangedKeys}
        onSetBreadcrumbs={() => {}}
      />
    )
  }, [schema, originalData, overrides])

  return <div style={{ flexGrow: 0 }}>{editor}</div>
}

export default SettingsPanel
