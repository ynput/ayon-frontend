import axios from 'axios'
import { useState, useMemo, useEffect } from 'react'

import SettingsEditor from '/src/containers/settingsEditor'

const AddonSettingsPanel = ({
  addon,
  onChange,
  onSetChangedKeys,
  localData,
  changedKeys,
  reloadTrigger,
  onSelect=()=>{},
  projectName = null,
}) => {
  const [schema, setSchema] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [overrides, setOverrides] = useState(null)

  const projectSuffix = projectName ? `/${projectName}` : ''


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
        .get(
          `/api/addons/${addon.name}/${addon.version}/settings${projectSuffix}`
        )
        .then((res) => {
          setOriginalData(res.data)
          //setNewData(null)
        })
        .catch((err) => console.log(err))
    }

    axios
      .get(
        `/api/addons/${addon.name}/${addon.version}/overrides${projectSuffix}`
      )
      .then((res) => setOverrides(res.data))
  }

  const onSetBreadcrumbs = (path) => {
    const fieldId = ["root", ...(path || [])].join('_')
    onSelect({
      addon,
      addonString: `${addon.name}@${addon.version}`,
      path,
      fieldId,
      hasOverride: overrides && overrides[fieldId] ? true : false,
    })
  }

  useEffect(() => {
    loadSchema()
    loadSettings()
  }, [addon.name, addon.version, reloadTrigger, projectName])

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
        onSetBreadcrumbs={onSetBreadcrumbs}
        level={projectName ? 'project' : 'studio'}
      />
    )
  }, [schema, originalData, overrides])

  return <div style={{ flexGrow: 0 }}>{editor}</div>
}

export default AddonSettingsPanel
