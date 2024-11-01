import { useMemo, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import {
  useGetAddonSettingsSchemaQuery,
  useGetAddonSettingsQuery,
  useGetAddonSettingsOverridesQuery,
} from '@queries/addonSettings'

import { setUri } from '@state/context'
import SettingsEditor from '@containers/SettingsEditor'

const AddonSettingsPanel = ({
  addon,
  localData,
  changedKeys,
  projectName = null,
  searchText,
  filterKeys,
  siteId = null,
  onChange = () => {},
  onLoad = () => {},
  onSetChangedKeys = () => {},
  onSelect = () => {},
  updateAddonSchema = () => {},
  currentSelection = null,
  context,
}) => {
  const dispatch = useDispatch()

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
    isSuccess,
    refetch: refetchSchema,
  } = useGetAddonSettingsSchemaQuery({
    addonName: addon.name,
    addonVersion: addon.version,
    variant: addon.variant,
    projectName,
    siteId,
  })

  useMemo(() => {
    if (isSuccess) {
      updateAddonSchema(addon.name, schema)
    }
  }, [addon.name, addon.version, isSuccess])

  const {
    //eslint-disable-next-line no-unused-vars
    data: originalData,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useGetAddonSettingsQuery({
    addonName: addon.name,
    addonVersion: addon.version,
    variant: addon.variant,
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
    variant: addon.variant,
    projectName,
    siteId,
  })

  const reload = async (force = false) => {
    await refetchSchema().unwrap()
    await refetchOverrides().unwrap()
    const res = await refetchSettings().unwrap()
    if (force || !localData) {
      onChange(res)
    }
    onLoad(res)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line no-unused-vars
  }, [addon.name, addon.version, addon.variant, siteId, projectName])

  useEffect(() => {
    if (localData) return
    reload(true)
  }, [localData])

  const breadcrumbs = useMemo(() => {
    if (!currentSelection) return null
    if (currentSelection.addonString !== `${addon.name}@${addon.version}`) return null
    return currentSelection.path
  }, [currentSelection])

  useEffect(() => {
    let uri = `ayon+settings://${addon.name}`
    //if (addon.version) uri += `:${addon.version}`
    if (currentSelection?.path) uri += `/${currentSelection.path.join('/')}`
    if (projectName) uri += `?project=${projectName}`
    if (siteId) uri += `&site=${siteId}`
    dispatch(setUri(uri))
  }, [currentSelection, addon.name, addon.version])

  useEffect(() => {
    return () => {
      dispatch(setUri(null))
    }
  }, [])

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
    // if (schemaLoading || settingsLoading || overridesLoading) return <>Loading...</>
    // if (!(schema && localData && overrides)) return <>Waiting for data...</>
    return (
      <SettingsEditor
        schema={schema}
        originalData={originalData}
        formData={localData}
        changedKeys={changedKeys}
        overrides={overrides}
        onChange={onChange}
        onSetChangedKeys={onSetChangedKeys}
        onSetBreadcrumbs={onSetBreadcrumbs}
        breadcrumbs={breadcrumbs}
        level={settingsLevel}
        context={context}
      />
    )
  }, [schema, localData, overrides, breadcrumbs, schemaLoading, settingsLoading, overridesLoading, searchText, filterKeys])

  // if (schemaLoading || settingsLoading || overridesLoading) {
  //   return `Loading... ${projectName}`
  // }

  const visibility = schemaLoading || settingsLoading || overridesLoading ? 'hidden' : 'visible'

  return <div style={{ flexGrow: 0, visibility }}>{editor}</div>
}

export default AddonSettingsPanel
