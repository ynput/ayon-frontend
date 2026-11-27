import { useCallback } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { setValueByPath } from '@containers/AddonSettings/utils'

type SettingsFormData = Record<string, any>

/** Sets the value at a path of the form data: for controls that edit a whole list at once */
const useSettingsSetValue = (
  formData: SettingsFormData,
  setFormData: (data: SettingsFormData) => void,
) =>
  useCallback(
    (path: string[], value: unknown) => {
      if (!formData) return
      setFormData(setValueByPath(cloneDeep(formData), path, value))
    },
    [formData, setFormData],
  )

export default useSettingsSetValue
