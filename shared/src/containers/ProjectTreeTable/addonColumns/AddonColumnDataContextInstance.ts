import { createContext, useContext } from 'react'

// what each addon column's useData returned, by column id, then entity id
export type AddonColumnData = Record<string, Record<string, unknown> | undefined>

export const AddonColumnDataContext = createContext<AddonColumnData>({})

export const useAddonColumnValue = (columnId: string, entityId: string) =>
  useContext(AddonColumnDataContext)[columnId]?.[entityId]
