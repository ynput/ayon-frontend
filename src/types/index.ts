import { api } from './graphqlTypes'
import { restApi } from './restTypes'

// export all global types
export * from './global'

export default {
  graphql: api,
  rest: restApi,
}
