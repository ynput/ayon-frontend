import { ayonApi } from '../ayon'
import constructOAuthToUrl from '/src/helpers/constructOAuthToUrl'

const getAuth = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getOAuthOptions: build.query({
      query: () => ({
        url: '/api/oauth2/options',
      }),
      transformResponse: (response) =>
        response?.options.map((option) => ({
          name: option.name,
          url: constructOAuthToUrl(option.url, option.client_id, option.name, option.scope),
        })),
    }),
  }),
})

//

export const { useGetOAuthOptionsQuery, useLazyLoginQuery } = getAuth
