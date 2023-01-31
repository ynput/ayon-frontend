import { ayonApi } from './ayon'

const addonList = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getAddonList: build.query({
      query: () => ({
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
              productionVersion: addon.productionVersion,
              stagingVersion: addon.stagingVersion,
            },
          }

          if (showVersions) {
            for (const version in addon.versions) {
              if (withSettings === 'settings' && !addon.versions[version].hasSettings) continue
              if (withSettings === 'site' && !addon.versions[version].hasSiteSettings) continue

              let usage = []
              if (addon.productionVersion === version) usage.push('PROD')
              if (addon.stagingVersion === version) usage.push('STAG')

              row.children.push({
                key: `${addon.name}@${version}`,
                selectable: true,
                data: {
                  name: addon.name,
                  title: addon.title,
                  version: version,
                  productionVersion: addon.productionVersion,
                  stagingVersion: addon.stagingVersion,
                  usage: usage.join(', '),
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

    getAddonProject: build.query({
      query: () => ({
        url: `/api/addons`,
        method: 'GET',
      }),
      providesTags: ['addonList'],
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      transformResponse: (response) => {
        let result = []
        for (const definition of response.addons) {
          const versDef = definition.versions[definition.productionVersion]
          if (!versDef) continue
          const projectScope = versDef.frontendScopes['project']
          if (!projectScope) continue

          result.push({
            name: definition.name,
            title: definition.title,
            version: definition.productionVersion,
            settings: projectScope,
          })
        }

        return result
      },
    }),

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

export const { useGetAddonListQuery, useGetAddonProjectQuery, useSetAddonVersionMutation } =
  addonList
