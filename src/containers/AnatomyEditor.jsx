import { useEffect, useState } from 'react'
import {
  useGetAnatomyPresetQuery,
  useGetAnatomySchemaQuery,
} from '/src/services/anatomy/getAnatomy'

import { isEqual } from 'lodash'

import SettingsEditor from '/src/containers/SettingsEditor'

const AnatomyEditor = ({
  preset,
  formData,
  setFormData,
  breadcrumbs,
  setBreadcrumbs,
  setIsChanged,
}) => {
  const [originalData, setOriginalData] = useState(null)

  const { data: schema } = useGetAnatomySchemaQuery()

  const { data: anatomyData, isSuccess } = useGetAnatomyPresetQuery({ preset }, { skip: !preset })

  useEffect(() => {
    if ((isSuccess, anatomyData)) {
      setFormData(anatomyData)
      setOriginalData(anatomyData)
    }
  }, [preset, isSuccess, anatomyData])

  useEffect(() => {
    if (!setIsChanged) return
    if (!originalData || !formData) {
      setIsChanged(!isEqual(originalData, formData))
      return
    }
    setIsChanged(!isEqual(originalData, formData))
  }, [formData, originalData, setIsChanged])

  if (!(schema && originalData)) return null

  return (
    <SettingsEditor
      schema={schema}
      originalData={originalData}
      formData={formData}
      onChange={setFormData}
      onSetBreadcrumbs={setBreadcrumbs}
      breadcrumbs={breadcrumbs}
    />
  )
}

export default AnatomyEditor
