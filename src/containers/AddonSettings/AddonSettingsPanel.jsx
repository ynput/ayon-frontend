import { useCallback, useEffect, useMemo } from 'react'

import {
  useGetAddonSettingsSchemaQuery,
  useGetAddonSettingsQuery,
  useGetAddonSettingsOverridesQuery,
} from '@queries/addonSettings'

import SettingsEditor from '@containers/SettingsEditor'
import { useURIContext } from '@shared/context'

const noop = () => {}

const AddonSettingsPanel = ({
  addon,
  localData,
  changedKeys,
  projectName = null,
  siteId = null,
  onChange = noop,
  onLoad = noop,
  onSetChangedKeys = noop,
  onSelect = noop,
  updateAddonSchema,
  currentSelection = null,
  context,
}) => {
  let settingsLevel = 'studio'
  if (projectName && projectName !== '_') {
    settingsLevel = 'project'
    if (siteId && siteId !== '_') {
      settingsLevel = 'site'
    }
  }

  const queryArgs = {
    addonName: addon.name,
    addonVersion: addon.version,
    variant: addon.variant,
    projectName,
    siteId,
  }

  const {
    data: schema,
    isLoading: schemaLoading,
    isSuccess,
  } = useGetAddonSettingsSchemaQuery(queryArgs)

  useEffect(() => {
    if (isSuccess) {
      updateAddonSchema?.(addon.name, schema)
    }
  }, [addon.name, isSuccess, schema, updateAddonSchema])

  const { data: originalData, isLoading: settingsLoading } = useGetAddonSettingsQuery(queryArgs)

  const { data: overrides, isLoading: overridesLoading } =
    useGetAddonSettingsOverridesQuery(queryArgs)

  useEffect(() => {
    if (originalData === undefined) return
    if (!localData) onChange(addon, siteId || '_', originalData)
    onLoad(addon, siteId || '_', originalData)
  }, [addon, localData, onChange, onLoad, originalData, siteId])

  const breadcrumbs = useMemo(() => {
    if (!currentSelection) return null
    if (currentSelection.addonString !== `${addon.name}@${addon.version}`) return null
    return currentSelection.path
  }, [addon.name, addon.version, currentSelection])

  const { setUri } = useURIContext()

  useEffect(() => {
    let uri = `ayon+settings://${addon.name}`
    //if (addon.version) uri += `:${addon.version}`
    if (currentSelection?.path) uri += `/${currentSelection.path.join('/')}`
    const params = new URLSearchParams()
    if (projectName) params.set('project', projectName)
    if (siteId && siteId !== '_') params.set('site', siteId)
    const query = params.toString()
    if (query) uri += `?${query}`
    setUri(uri)
  }, [currentSelection, addon.name, addon.version, projectName, setUri, siteId])

  useEffect(() => {
    return () => setUri(null)
  }, [setUri])

  const onSetBreadcrumbs = useCallback(
    (path) => {
      const fieldId = ['root', ...(path || [])].join('_')
      onSelect({
        addon,
        addonString: `${addon.name}@${addon.version}`,
        path,
        siteId,
        fieldId,
        hasOverride: overrides && overrides[fieldId] ? true : false,
      })
    },
    [addon, onSelect, overrides, siteId],
  )

  const handleSettingsChange = useCallback(
    (data) => onChange(addon, siteId || '_', data),
    [addon, onChange, siteId],
  )

  const editor = (
    <SettingsEditor
      schema={schema}
      originalData={originalData}
      formData={localData}
      changedKeys={changedKeys}
      overrides={overrides}
      onChange={handleSettingsChange}
      onSetChangedKeys={(data) => onSetChangedKeys(addon, siteId || '_', data)}
      onSetBreadcrumbs={onSetBreadcrumbs}
      breadcrumbs={breadcrumbs}
      level={settingsLevel}
      context={context}
    />
  )

  // if (schemaLoading || settingsLoading || overridesLoading) {
  //   return `Loading... ${projectName}`
  // }

  const visibility = schemaLoading || settingsLoading || overridesLoading ? 'hidden' : 'visible'

  return <div style={{ flexGrow: 0, visibility }}>{editor}</div>
}

export default AddonSettingsPanel
