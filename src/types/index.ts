import { api } from './graphqlTypes'
import { restApi } from './restTypes'

const APIS = {
  graphql: api,
  rest: restApi,
}

// Define a type for the keys of APIS
type ApiKeys = keyof typeof APIS

type Enhancements = {
  rest?: Parameters<typeof restApi.enhanceEndpoints>[0]
  graphql?: Parameters<typeof api.enhanceEndpoints>[0]
}

// Function to wrap enhanceEndpoints for each API
const enhanceAllEndpoints = (enhancements: Enhancements) => {
  const enhancedApi = {} as {
    [K in ApiKeys]: ReturnType<(typeof APIS)[K]['enhanceEndpoints']>
  }

  Object.keys(enhancements).forEach((key) => {
    const apiType = key as ApiKeys
    if (enhancements[apiType]) {
      // @ts-ignore
      enhancedApi[apiType] = APIS[apiType].enhanceEndpoints(enhancements[apiType]!)
    } else {
      // @ts-ignore
      enhancedApi[apiType] = APIS[apiType]
    }
  })

  return enhancedApi
}

enhanceAllEndpoints({
  rest: {
    endpoints: {
      getProject: {},
    },
  },
})

export default {
  graphql: api,
  rest: restApi,
  enhance: enhanceAllEndpoints,
}
