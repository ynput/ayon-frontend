import { toast } from 'react-toastify'
import { cloneDeep } from 'lodash'
import { getValueByPath, setValueByPath, sameKeysStructure } from '@containers/AddonSettings/utils'
import { usePaste } from '@context'

// pastes a copied settings value (JSON) at a path of the form data
const useSettingsPaste = (formData, setFormData) => {
  const { requestPaste } = usePaste()

  return async (path) => {
    const pastedContent = await requestPaste()
    if (!pastedContent) {
      toast.error('No content to paste')
      return
    }
    let value
    try {
      value = JSON.parse(pastedContent)
    } catch {
      toast.error('Invalid JSON')
      return
    }
    const oldValue = path.length === 0 ? formData : getValueByPath(formData, path)
    if (oldValue === undefined) {
      toast.error('No data to paste')
      return
    }
    if (!sameKeysStructure(oldValue, value)) {
      toast.error('Incompatible data structure')
      console.log('oldValue', oldValue)
      console.log('value', value)
      return
    }

    let newData = cloneDeep(formData)
    newData = setValueByPath(newData, path, value)
    setFormData(newData)
  }
}

export default useSettingsPaste
