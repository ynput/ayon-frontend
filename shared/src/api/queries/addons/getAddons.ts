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

// version of an addon in the bundle to show, undefined when the bundle doesn't have it
export type ScopedAddonVersion = (addonName: string) => string | undefined

type ScopedAddonsArg = {
  // defaults to the production version
  getVersion?: ScopedAddonVersion
}

// addons with a frontend for the scope, in the version of the given bundle
const getScopedAddons = (
  response: ListAddonsApiResponse,
  scope: AddonScope,
  getVersion?: ScopedAddonVersion,
): ScopedAddon[] => {
  const result: ScopedAddon[] = []
  for (const definition of response.addons) {
    const version = getVersion ? getVersion(definition.name) : definition.productionVersion
    const versDef = version ? definition.versions[version] : undefined
    if (!version || !versDef) continue
    const scopeSettings = (versDef.frontendScopes as Record<string, any> | undefined)?.[scope]
    if (!scopeSettings) continue

    result.push({
      name: definition.name,
      title: definition.title,
      version,
      settings: scopeSettings,
    })
  }
  return result
}

// The scoped lists are derived from listAddons({}) instead of being separate queries:
// it's the same GET /api/addons, so pages no longer request it two or three times on load,
// and the lists refresh when addons change ('addonList' tag).
const useScopedAddonsQuery =
  (scope: AddonScope) =>
  ({ getVersion }: ScopedAddonsArg = {}, options?: { skip?: boolean }) => {
    const result = useListAddonsQuery({}, options)
    const data = useMemo(
      () => (result.data ? getScopedAddons(result.data, scope, getVersion) : undefined),
      [result.data, getVersion],
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
