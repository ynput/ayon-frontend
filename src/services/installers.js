import api from '@api'
import queryUpload from './queryUpload'
import { coerce, rcompare } from 'semver'

const getInstallers = api.injectEndpoints({
  endpoints: (build) => ({
    getInstallerList: build.query({
      query: () => ({
        url: `/api/desktop/installers`,
      }),
      transformResponse: (res) => {
        //  coerce versions using semver
        const installers = res.installers?.map((i) => ({
          ...i,
          semver: coerce(i.version)?.version || null,
        }))

        // sort by version using semver, null semver go last
        return installers?.sort((a, b) => {
          if (a.semver && b.semver) {
            const semverComparison = rcompare(a.semver, b.semver)
            if (semverComparison === 0) {
              return b.version.localeCompare(a.version)
            } else {
              return semverComparison
            }
          } else if (a.semver) {
            return -1
          } else if (b.semver) {
            return 1
          } else {
            return a.version.localeCompare(b.version)
          }
        })
      },
      providesTags: () => [{ type: 'installerList' }],
    }),
    // create installer
    createInstaller: build.mutation({
      query: ({ data, endPoint = 'installers' }) => ({
        url: `/api/desktop/${endPoint}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['installerList', 'dependencyPackageList'],
    }),
    uploadInstallers: build.mutation({
      queryFn: (arg, api) => queryUpload(arg, api, { endpoint: '/api/desktop/installers' }),
    }),
  }), // endpoints
  overrideExisting: true,
})

export const { useGetInstallerListQuery, useCreateInstallerMutation, useUploadInstallersMutation } =
  getInstallers
