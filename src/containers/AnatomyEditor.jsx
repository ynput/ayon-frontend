import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  useGetAnatomyPresetQuery,
  useGetAnatomySchemaQuery,
} from '/src/services/anatomy/getAnatomy'

import { isEqual } from 'lodash'

import SettingsEditor from '/src/containers/SettingsEditor'
import {
  getValueByPath,
  setValueByPath,
  sameKeysStructure,
} from '/src/containers/AddonSettings/utils'
import { cloneDeep } from 'lodash'

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

  const onPasteValue = async (path) => {
    try {
      const text = await navigator.clipboard.readText()
      const value = JSON.parse(text)
      const oldValue = getValueByPath(formData, path)
      if (!sameKeysStructure(oldValue, value)) {
        toast.error('Icompatible data structure')
        return
      }

      let newData = cloneDeep(formData)
      newData = setValueByPath(formData, path, value)

      setFormData(newData)
    } catch (e) {
      console.error(e)
    }
  }

  if (!(schema && originalData)) return null

  return (
    <SettingsEditor
      schema={schema}
      originalData={originalData}
      formData={formData}
      onChange={setFormData}
      onSetBreadcrumbs={setBreadcrumbs}
      breadcrumbs={breadcrumbs}
      context={{
        onPasteValue: onPasteValue,
      }}
    />
  )
}

export default AnatomyEditor
