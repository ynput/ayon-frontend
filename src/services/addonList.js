import { ayonApi } from './ayon'

const addonList = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    //  Return a list of all addons installed on the server

    getAddonList: build.query({
      query: () => ({
        url: `/api/addons`,
        method: 'GET',
      }),

      providesTags: ['addonList'],
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      transformResponse: (response) => response.addons || [],
    }), // getAddonList

    // Return a list of addons which have project-scoped frontend
    // TODO: Refactor: rename to getProjectAddons (probably)

    getAddonProject: build.query({
      query: () => ({
        url: `/api/addons`,
        method: 'GET',
      }),
      providesTags: ['projectAddons'],
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

    // Set production and staging version of an addon
    // Set to null to disable the addon in the respective environment
    // When productionVersion or stagingVersion is not set,
    // the respective environment is not changed.

    setAddonVersion: build.mutation({
      query: ({ addonName, stagingVersion, productionVersion }) => ({
        url: '/api/addons',
        method: 'POST',
        body: {
          versions: {
            [addonName]: { stagingVersion, productionVersion },
          },
        },
      }),
      invalidatesTags: ['addonList'],
    }), // setAddonVersion

    // Set production and staging versions of multiple addons
    // at once. syntax is { [addonName]: { stagingVersion, productionVersion } }

    setAddonVersions: build.mutation({
      query: (versions) => ({
        url: '/api/addons',
        method: 'POST',
        body: {
          versions,
        },
      }),
      invalidatesTags: ['addonList'],
    }), // setAddonVersions
  }), // endpoints
})

export const {
  useGetAddonListQuery,
  useGetAddonProjectQuery,
  useSetAddonVersionMutation,
  useSetAddonVersionsMutation,
} = addonList
