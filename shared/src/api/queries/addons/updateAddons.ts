import type { UploadAddonZipFileApiArg } from '@shared/api/generated'
import getAddonsApi from './getAddons'
import { normalizeQueryError } from '@shared/api/base/queryError'

const updateAddonsApiEnhanced = getAddonsApi.enhanceEndpoints({
  endpoints: {
    deleteAddonVersion: {
      invalidatesTags: ['addonList'],
    },
    uploadAddonZipFile: {
      invalidatesTags: [
        'info',
        'bundleList',
        'addonList',
        'addonSettingsList',
        'installerList',
        'dependencyPackage',
      ],
    },
  },
})

type DeleteAddonVersionsApiArg = {
  addons: { name: string; version: string }[]
}

export type DownloadAddonsApiResponse = string[] | undefined

export type DownloadAddonsApiArg = {
  addons: {
    url: UploadAddonZipFileApiArg['url']
    name: UploadAddonZipFileApiArg['addonName']
    version: UploadAddonZipFileApiArg['addonVersion']
  }[]
}

const updateAddonsApi = updateAddonsApiEnhanced.injectEndpoints({
  endpoints: (build) => ({
    // delete multiple addon versions at once
    deleteAddonVersions: build.mutation<undefined, DeleteAddonVersionsApiArg>({
      async queryFn({ addons = [] }, { dispatch }) {
        const promises = []

        for (const addon of addons) {
          if (!addon.name || !addon.version) continue

          promises.push(
            dispatch(
              updateAddonsApiEnhanced.endpoints.deleteAddonVersion.initiate({
                addonName: addon.name,
                addonVersion: addon.version,
              }),
            ),
          )
        }

        try {
          await Promise.all(promises)
          return { data: undefined }
        } catch (e: any) {
          return { error: normalizeQueryError(e) }
        }
      },
    }),
    downloadAddons: build.mutation<DownloadAddonsApiResponse, DownloadAddonsApiArg>({
      queryFn: async (arg, { dispatch }) => {
        const { addons = [] } = arg || {}
        let promises = []

        for (const addon of addons) {
          if (!addon.url || !addon.name || !addon.version) continue

          promises.push(
            dispatch(
              updateAddonsApiEnhanced.endpoints.uploadAddonZipFile.initiate({
                url: addon.url,
                addonName: addon.name,
                addonVersion: addon.version,
              }),
            ),
          )
        }

        try {
          const results = await Promise.allSettled(promises)

          // add eventIds to array
          const eventIds = results
            .filter((res) => res.status === 'fulfilled')
            .flatMap((res) => (res.value.data?.eventId ? [res.value.data.eventId] : []))

          return { data: eventIds }
        } catch (e: any) {
          return {
            error: normalizeQueryError(e),
          }
        }
      },
    }),
  }), // endpoints
  overrideExisting: true,
})

export const { useDeleteAddonVersionsMutation, useDownloadAddonsMutation } = updateAddonsApi
export { updateAddonsApi as addonsQueries }
