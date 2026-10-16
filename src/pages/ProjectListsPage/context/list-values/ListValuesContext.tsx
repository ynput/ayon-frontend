import { ReactNode, useCallback, useMemo } from 'react'
import { useLoadModule } from '@shared/hooks'
import { usePowerpack } from '@shared/context'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { useListsAttributesContext } from '../lists-attributes'
import { communityListValues } from '../../listValues/communityListValues'
import { LIST_VALUES_API_VERSION, type ListValuesModule } from '../../listValues/types'
import { formatListValue } from '../../listValues/formatListValue'
import { ListValuesContext, type ListValuesContextValue } from './ListValuesContextInstance'

// first powerpack version with the ListValues module
const LIST_VALUES_MIN_VERSION = '1.6.7'

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

  const [loadedModule, { isLoading }] = useLoadModule<ListValuesModule>({
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

  const listAttributeNames = useMemo(() => listAttributes.map((a) => a.name), [listAttributes])

  const formatValue = useCallback(
    (attrib: string, value: unknown) =>
      formatListValue(
        [...listAttributes, ...attribFields].find((field) => field.name === attrib),
        value,
      ),
    [listAttributes, attribFields],
  )

  const rules = useMemo(
    () => ({ listAttributes: listAttributeNames, formatValue }),
    [listAttributeNames, formatValue],
  )

  const readsEntityValue = useCallback(
    (attrib: string) => module.getEditTarget(attrib, rules) === 'entity',
    [module, rules],
  )

  const value: ListValuesContextValue = useMemo(
    () => ({ module, isPowerFeature, rules, readsEntityValue }),
    [module, isPowerFeature, rules, readsEntityValue],
  )

  if (isLoading) return null
  return <ListValuesContext.Provider value={value}>{children}</ListValuesContext.Provider>
}
