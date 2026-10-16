import { createContext, useContext } from 'react'
import type {
  ListValuesContext as ListValuesRulesContext,
  ListValuesModule,
} from '../../listValues/types'

export interface ListValuesContextValue {
  module: ListValuesModule // the powerpack module, or the community fallback
  isPowerFeature: boolean
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
