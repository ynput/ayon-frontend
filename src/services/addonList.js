import { ayonApi } from './ayon'

const addonList = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getAddonList: build.query({
      // arguments are used in transformResponse, so we need to silence eslint here
      // eslint-disable-next-line no-unused-vars
      query: ({ showVersions, withSettings }) => ({
        url: `/api/addons`,
        method: 'GET',
      }),

      providesTags: ['addonList'],
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      transformResponse: (response, meta, arg) => {
        let result = []

        const showVersions = arg.showVersions || false
        const withSettings = arg.withSettings || 'settings'

        for (const addon of response.addons) {
          const selectable = addon.productionVersion !== undefined && !showVersions
          const row = {
            key: showVersions ? addon.name : `${addon.name}@${addon.productionVersion}`,
            selectable: selectable,
            children: [],
            data: {
              name: addon.name,
              title: addon.title,
              version: showVersions ? '' : addon.productionVersion,
            },
          }

          if (showVersions) {
            for (const version in addon.versions) {
              if (withSettings === 'settings' && !addon.versions[version].hasSettings) continue
              if (withSettings === 'site' && !addon.versions[version].hasSiteSettings) continue

              row.children.push({
                key: `${addon.name}@${version}`,
                selectable: true,
                data: {
                  name: addon.name,
                  title: addon.title,
                  version: version,
                  productionVersion: addon.productionVersion,
                  stagingVersion: addon.stagingVersion,
                  usage:
                    addon.productionVersion === version
                      ? 'Production'
                      : addon.stagingVersion === version
                      ? 'Staging'
                      : '',
                },
              })
            }
            if (!row.children.length) continue
          } // if showVersions
          else {
            if (
              withSettings === 'settings' &&
              !addon.versions[addon.productionVersion]?.hasSettings
            )
              continue
            if (
              withSettings === 'site' &&
              !addon.versions[addon.productionVersion]?.hasSiteSettings
            )
              continue
          }

          result.push(row)
        }
        return result
      }, // transformResponse
    }), // getAddonList

    setAddonVersion: build.mutation({
      // eslint-disable-next-line no-unused-vars
      query: ({ projectName, addonName, productionVersion, stagingVersion }) => {
        // TODO: per-project addon version overrides
        const data = {
          versions: {
            [addonName]: { productionVersion, stagingVersion },
          },
        }
        return {
          url: `/api/addons`,
          method: 'POST',
          body: data,
        }
      },
      invalidatesTags: ['addonList'],
    }), // setAddonVersion
  }), // endpoints
})

export const { useGetAddonListQuery, useSetAddonVersionMutation } = addonList
