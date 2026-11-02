import { useMemo } from 'react'
import { addonsApi } from '@shared/api/generated'
import type { ListAddonsApiResponse } from '@shared/api/generated'

const enhancedApi = addonsApi.enhanceEndpoints({
  endpoints: {
    listAddons: {
      providesTags: ['addonList'],
    },
  },
})

export const { useListAddonsQuery } = enhancedApi

type AddonScope = 'project' | 'settings' | 'dashboard'

export type ScopedAddon = {
  name: string
  title: string
  version: string
  settings: any
}

// addons with a frontend for the scope, in their production version
const getScopedAddons = (response: ListAddonsApiResponse, scope: AddonScope): ScopedAddon[] => {
  const result: ScopedAddon[] = []
  for (const definition of response.addons) {
    const versDef = definition.versions[definition.productionVersion as string]
    if (!versDef) continue
    const scopeSettings = (versDef.frontendScopes as Record<string, any> | undefined)?.[scope]
    if (!scopeSettings) continue

    result.push({
      name: definition.name,
      title: definition.title,
      version: definition.productionVersion as string,
      settings: scopeSettings,
    })
  }
  return result
}

// The scoped lists are derived from listAddons({}) instead of being separate queries:
// it's the same GET /api/addons, so pages no longer request it two or three times on load,
// and the lists refresh when addons change ('addonList' tag).
const useScopedAddonsQuery =
  (scope: AddonScope) => (_arg?: unknown, options?: { skip?: boolean }) => {
    const result = useListAddonsQuery({}, options)
    const data = useMemo(
      () => (result.data ? getScopedAddons(result.data, scope) : undefined),
      [result.data],
    )
    return { ...result, data }
  }

// Return a list of addons which have project-scoped frontend
export const useGetProjectAddonsQuery = useScopedAddonsQuery('project')
// Return a list of addons with settings-scoped frontend
export const useGetSettingsAddonsQuery = useScopedAddonsQuery('settings')
// Return a list of addons with dashboard-scoped frontend
export const useGetDashboardAddonsQuery = useScopedAddonsQuery('dashboard')

export default enhancedApi
