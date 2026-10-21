import { createContext, useContext } from 'react'
import type {
  ListValuesContext as ListValuesRulesContext,
  ListValuesModule,
} from '../../listValues/types'
import type { ListValuesOutdated } from '../../listValues/listValuesOutdated'

export interface ListValuesContextValue {
  module: ListValuesModule // the powerpack module, or the community fallback
  isPowerFeature: boolean
  // the powerpack is installed but older than the module: the version it needs
  outdated?: ListValuesOutdated
  rules: ListValuesRulesContext
  // the table shows the entity's value of this attribute (not the list value), so the query
  // sorts and filters by it
  readsEntityValue: (attrib: string) => boolean
}

export const ListValuesContext = createContext<ListValuesContextValue | undefined>(undefined)

export const useListValuesContext = () => {
  const context = useContext(ListValuesContext)
  if (context === undefined) {
    throw new Error('useListValuesContext must be used within a ListValuesProvider')
  }
  return context
}
