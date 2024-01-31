/*
 * AnatomyEditor is a wrapper around SettingsEditor specifically for anatomy settings.
 * It loads anatomy schema and displays the editor, it also handles loading anatomy:
 * either a preset or existing project (one of projectName or preset must be provided)
 *
 * It however does not handle saving anatomy, this is done by the parent component.
 * Along with simple editing, it also handles copy+paste of anatomy settings,
 * and dispatching breadcrumbs to the store.
 */

import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import {
  useGetAnatomyPresetQuery,
  useGetAnatomySchemaQuery,
} from '/src/services/anatomy/getAnatomy'

import { useGetProjectAnatomyQuery } from '/src/services/project/getProject'
import { isEqual } from 'lodash'

import { setUri } from '/src/features/context'
import SettingsEditor from '/src/containers/SettingsEditor'
import {
  getValueByPath,
  setValueByPath,
  sameKeysStructure,
} from '/src/containers/AddonSettings/utils'
import { cloneDeep } from 'lodash'
import pasteFromClipboard from '/src/helpers/pasteFromClipboard'

const AnatomyEditor = ({
  preset,
  projectName,
  formData,
  setFormData,
  breadcrumbs,
  setBreadcrumbs,
  setIsChanged,
}) => {
  const [originalData, setOriginalData] = useState(null)

  const { data: schema } = useGetAnatomySchemaQuery()

  const { data: anatomyPresetData, isLoading: presetLoading } = useGetAnatomyPresetQuery(
    { preset },
    { skip: !preset },
  )
  const { data: projectAnatomyData, isLoading: prjLoading } = useGetProjectAnatomyQuery(
    { projectName },
    { skip: !projectName },
  )
  const dispatch = useDispatch()
  const isLoading = presetLoading || prjLoading

  useEffect(() => {
    if (!anatomyPresetData) return
    setFormData(anatomyPresetData)
    setOriginalData(anatomyPresetData)
  }, [anatomyPresetData])

  useEffect(() => {
    if (!projectAnatomyData) return
    setFormData(projectAnatomyData)
    setOriginalData(projectAnatomyData)
  }, [projectAnatomyData])

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
      const text = await pasteFromClipboard()
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

  if (isLoading) {
    return 'Loading...'
  }

  if (!(preset || projectName)) return 'No preset or project selected'
  if (preset && projectName) return 'Select either preset or project'
  if (!(schema && originalData)) return null

  const handleBreadcrumbs = (path) => {
    let uri = projectName ? `ayon+anatomy://${projectName}/` : `ayon+anatomy+preset://${preset}/`
    uri += path.join('/')
    dispatch(setUri(uri))

    if (setBreadcrumbs) setBreadcrumbs(path)
  }

  return (
    <SettingsEditor
      schema={schema}
      originalData={originalData}
      formData={formData}
      onChange={setFormData}
      onSetBreadcrumbs={handleBreadcrumbs}
      breadcrumbs={breadcrumbs}
      context={{
        onPasteValue: onPasteValue,
      }}
    />
  )
}

export default AnatomyEditor
