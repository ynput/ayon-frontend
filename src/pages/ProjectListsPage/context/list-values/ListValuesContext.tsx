import { ReactNode, useCallback, useMemo } from 'react'
import { useLoadModule } from '@shared/hooks'
import { usePowerpack } from '@shared/context'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { useListsViewSettings } from '@shared/containers/Views'
import { useListsAttributesContext } from '../lists-attributes'
import { communityListValues } from '../../listValues/communityListValues'
import {
  LIST_VALUES_API_VERSION,
  type CompareSettings,
  type ListValuesModule,
} from '../../listValues/types'
import { formatListValue } from '../../listValues/formatListValue'
import type { ListValuesOutdated } from '../../listValues/listValuesOutdated'
import { ListValuesContext, type ListValuesContextValue } from './ListValuesContextInstance'

// first powerpack version with the ListValues module
const LIST_VALUES_MIN_VERSION = '1.6.8'

const NO_SETTINGS: CompareSettings = {}

type Props = { children: ReactNode }

// Renders the page once the module is known: the module's hooks (useCompareView) run below, so
// building the page with the fallback first would build it twice
export const ListValuesProvider = ({ children }: Props) => {
  const { powerLicense, isLoading } = usePowerpack()
  if (isLoading) return null
  return (
    <ModuleProvider key={powerLicense ? 'powerpack' : 'community'} powerLicense={powerLicense}>
      {children}
    </ModuleProvider>
  )
}

const ModuleProvider = ({ children, powerLicense }: Props & { powerLicense: boolean }) => {
  const { listAttributes } = useListsAttributesContext()
  const { attribFields } = useProjectDataContext()

  const [loadedModule, { isLoading, isLoaded, outdated }] = useLoadModule<ListValuesModule>({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'ListValues',
    fallback: communityListValues,
    minVersion: LIST_VALUES_MIN_VERSION,
    skip: !powerLicense,
  })
  const module =
    loadedModule?.apiVersion === LIST_VALUES_API_VERSION ? loadedModule : communityListValues
  const isPowerFeature = module !== communityListValues

  // with a license, the module failed to load without being outdated: the production bundle has
  // no addon or no ListValues module (useLoadModule doesn't say which)
  const notInBundle = powerLicense && !isLoading && !isLoaded && !outdated

  // useLoadModule builds a new object each render: keep one until the versions change
  const outdatedCurrent = outdated?.current
  const outdatedRequired = outdated?.required
  const outdatedVersion = useMemo<ListValuesOutdated | undefined>(() => {
    if (outdatedRequired) return { current: outdatedCurrent, required: outdatedRequired }
    if (notInBundle) return { required: LIST_VALUES_MIN_VERSION }
    return undefined
  }, [outdatedCurrent, outdatedRequired, notInBundle])

  const listAttributeNames = useMemo(() => listAttributes.map((a) => a.name), [listAttributes])

  // stored with the view, shaped by the module; read here only, so every part of the page sees
  // a change at once (each useListsViewSettings keeps its own pending copy)
  const { listValues: storedSettings, onUpdateListValues: setSettings } = useListsViewSettings()
  const settings = (storedSettings as CompareSettings | undefined) || NO_SETTINGS
  const editTarget = isPowerFeature ? settings.editTarget : undefined

  const formatValue = useCallback(
    (attrib: string, value: unknown) =>
      formatListValue(
        [...listAttributes, ...attribFields].find((field) => field.name === attrib),
        value,
      ),
    [listAttributes, attribFields],
  )

  const rules = useMemo(
    () => ({ listAttributes: listAttributeNames, formatValue, editTarget }),
    [listAttributeNames, formatValue, editTarget],
  )

  const readsEntityValue = useCallback(
    (attrib: string) => module.getEditTarget(attrib, rules) === 'entity',
    [module, rules],
  )

  // what the module does with the entities' attributes (an older one ignores editTarget)
  const entityAttrib = attribFields.find((field) => !listAttributeNames.includes(field.name))
  const editsEntities = !entityAttrib || readsEntityValue(entityAttrib.name)

  const value: ListValuesContextValue = useMemo(
    () => ({
      module,
      isPowerFeature,
      outdated: outdatedVersion,
      rules,
      readsEntityValue,
      editsEntities,
      settings,
      setSettings,
    }),
    [
      module,
      isPowerFeature,
      outdatedVersion,
      rules,
      readsEntityValue,
      editsEntities,
      settings,
      setSettings,
    ],
  )

  if (isLoading) return null
  return <ListValuesContext.Provider value={value}>{children}</ListValuesContext.Provider>
}
