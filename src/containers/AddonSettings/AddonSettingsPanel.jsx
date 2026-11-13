import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  useGetAddonSettingsSchemaQuery,
  useGetAddonSettingsQuery,
  useGetAddonSettingsOverridesQuery,
} from '@queries/addonSettings'

import SettingsEditor from '@containers/SettingsEditor'
import { useURIContext } from '@shared/context'

const noop = () => {}

const shallowEqualEntries = (a, b) =>
  a.length === b.length &&
  a.every(([key, value], i) => b[i][0] === key && Object.is(b[i][1], value))

/**
 * The parent builds `context` on every render. This one stays the same object while its
 * values do, so the editor can skip a render; its callbacks always call the latest ones.
 */
const useStableContext = (context) => {
  const latest = useRef(context)
  latest.current = context
  const stable = useRef({ values: null, context: undefined })

  const values = Object.entries(context || {}).filter(([, value]) => typeof value !== 'function')
  if (!stable.current.values || !shallowEqualEntries(stable.current.values, values)) {
    const wrapped = Object.entries(context || {}).map(([key, value]) => [
      key,
      typeof value === 'function' ? (...args) => latest.current?.[key]?.(...args) : value,
    ])
    stable.current = { values, context: context && Object.fromEntries(wrapped) }
  }
  return stable.current.context
}

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

  const {
    data: originalData,
    isLoading: settingsLoading,
    fulfilledTimeStamp,
    refetch: refetchSettings,
  } = useGetAddonSettingsQuery(queryArgs)

  const { data: overrides, isLoading: overridesLoading } =
    useGetAddonSettingsOverridesQuery(queryArgs)

  // localData is cleared after a save or an override change (reloadAddons). The cached
  // values can predate it, so the form waits for a response that arrives after the reload
  const reloadStartedAt = useRef(0)
  const hadLocalData = useRef(false)
  const [reloadFailures, setReloadFailures] = useState(0)

  useEffect(() => {
    if (localData) {
      hadLocalData.current = true
      return
    }
    if (!hadLocalData.current) return
    hadLocalData.current = false
    reloadStartedAt.current = Date.now()
    refetchSettings()
      .unwrap()
      .catch(() => {
        // fall back to the cached values rather than leave the form empty
        reloadStartedAt.current = 0
        setReloadFailures((count) => count + 1)
      })
  }, [localData, refetchSettings])

  useEffect(() => {
    if (originalData === undefined) return
    onLoad(addon, siteId || '_', originalData)
    if (localData) return
    if ((fulfilledTimeStamp ?? 0) <= reloadStartedAt.current) return
    onChange(addon, siteId || '_', originalData)
  }, [addon, fulfilledTimeStamp, localData, onChange, onLoad, originalData, reloadFailures, siteId])

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

  // several addons (and sites) share the page: their group ids must differ
  const anchorScope = [addon.name, siteId]
    .filter(Boolean)
    .join('-')
    .replace(/[^\w-]/g, '-')

  const handleSettingsChange = useCallback(
    (data) => onChange(addon, siteId || '_', data),
    [addon, onChange, siteId],
  )

  const handleSetChangedKeys = useCallback(
    (data) => onSetChangedKeys(addon, siteId || '_', data),
    [addon, onSetChangedKeys, siteId],
  )
  const editorContext = useStableContext(context)

  // RJSF fills an empty form with the schema defaults and reports them as a change, which
  // would then replace the saved values. So the form keeps its last values during a reload
  const shownData = useRef(localData)
  if (localData) shownData.current = localData
  const formData = localData ?? shownData.current

  // several addons share the page: an edit in one doesn't redraw the others
  const editor = useMemo(
    () =>
      formData && (
        <SettingsEditor
          schema={schema}
          originalData={originalData}
          formData={formData}
          changedKeys={changedKeys}
          overrides={overrides}
          onChange={handleSettingsChange}
          onSetChangedKeys={handleSetChangedKeys}
          onSetBreadcrumbs={onSetBreadcrumbs}
          breadcrumbs={breadcrumbs}
          level={settingsLevel}
          context={editorContext}
          // AddonSettings draws one outline for every selected addon
          outline={false}
          anchorScope={anchorScope}
        />
      ),
    [
      anchorScope,
      breadcrumbs,
      changedKeys,
      editorContext,
      formData,
      handleSetChangedKeys,
      handleSettingsChange,
      onSetBreadcrumbs,
      originalData,
      overrides,
      schema,
      settingsLevel,
    ],
  )
  if (!formData) return <div style={{ flexGrow: 0, visibility: 'hidden' }} />

  // if (schemaLoading || settingsLoading || overridesLoading) {
  //   return `Loading... ${projectName}`
  // }

  const visibility = schemaLoading || settingsLoading || overridesLoading ? 'hidden' : 'visible'

  return <div style={{ flexGrow: 0, visibility }}>{editor}</div>
}

export default AddonSettingsPanel
