import { useMemo, useEffect } from 'react'

import {
  useGetAddonSettingsSchemaQuery,
  useGetAddonSettingsQuery,
  useGetAddonSettingsOverridesQuery,
} from '/src/services/addonSettings'

import SettingsEditor from '/src/containers/settingsEditor'

const AddonSettingsPanel = ({
  addon,
  onChange,
  onSetChangedKeys,
  localData,
  changedKeys,
  reloadTrigger,
  onSelect = () => {},
  projectName = null,
  siteId = null,
}) => {
  let settingsLevel = 'studio'
  if (projectName && projectName !== '_') {
    settingsLevel = 'project'
    if (siteId && siteId !== '_') {
      settingsLevel = 'site'
    }
  }

  const {
    data: schema,
    isLoading: schemaLoading,
    refetch: refetchSchema,
  } = useGetAddonSettingsSchemaQuery({
    addonName: addon.name,
    addonVersion: addon.version,
    projectName,
    siteId,
  })

  const {
    data: originalData,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useGetAddonSettingsQuery({
    addonName: addon.name,
    addonVersion: addon.version,
    projectName,
    siteId,
  })

  const {
    data: overrides,
    isLoading: overridesLoading,
    refetch: refetchOverrides,
  } = useGetAddonSettingsOverridesQuery({
    addonName: addon.name,
    addonVersion: addon.version,
    projectName,
    siteId,
  })

  useEffect(() => {
    refetchSchema()
    refetchSettings()
    refetchOverrides()
  }, [addon.name, addon.version, reloadTrigger, projectName])

  useEffect(() => {
    if (originalData && !settingsLoading) {
      onChange(originalData)
    }
  }, [originalData])

  const onSetBreadcrumbs = (path) => {
    const fieldId = ['root', ...(path || [])].join('_')
    onSelect({
      addon,
      addonString: `${addon.name}@${addon.version}`,
      path,
      siteId,
      fieldId,
      hasOverride: overrides && overrides[fieldId] ? true : false,
    })
  }

  const editor = useMemo(() => {
    if (!(schema && localData && overrides)) return <></>
    return (
      <SettingsEditor
        schema={schema}
        formData={localData}
        changedKeys={changedKeys}
        overrides={overrides}
        onChange={onChange}
        onSetChangedKeys={onSetChangedKeys}
        onSetBreadcrumbs={onSetBreadcrumbs}
        level={settingsLevel}
      />
    )
  }, [schema, localData, overrides])

  if (schemaLoading || settingsLoading || overridesLoading) {
    return 'Loading...'
  }

  return <div style={{ flexGrow: 0 }}>{editor}</div>
}

export default AddonSettingsPanel
