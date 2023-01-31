import { useMemo, useEffect } from 'react'

import {
  useGetAddonSettingsSchemaQuery,
  useGetAddonSettingsQuery,
  useGetAddonSettingsOverridesQuery,
} from '/src/services/addonSettings'

import SettingsEditor from '/src/containers/settingsEditor'

const AddonSettingsPanel = ({
  addon,
  localData,
  changedKeys,
  reloadTrigger,
  projectName = null,
  siteId = null,
  onChange = () => {},
  onLoad = () => {},
  onSetChangedKeys = () => {},
  onSelect = () => {},
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
    //eslint-disable-next-line no-unused-vars
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

  const reload = async () => {
    await refetchSchema()
    await refetchOverrides()
    //onChange({})
    const res = await refetchSettings()
    onChange(res.data)
    onLoad(res.data)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line no-unused-vars
  }, [addon.name, addon.version, reloadTrigger, projectName])

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
