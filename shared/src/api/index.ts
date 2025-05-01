import api from '../client'

// re-export the base api and graphql api
export * from '../client'
// re-export the base api and graphql api and override api exports from generated files that also export api
export { api } from '../client'
export default api
// export all rest api slices and queries
export * from './activities'
export { api as activitiesApi } from './activities'
export * from './modules'
export { api as modulesApi } from './modules'
export * from './auth'
export { api as authApi } from './auth'
export * from './folders'
export { api as foldersApi } from './folders'
export * from './operations'
export { api as operationsApi } from './operations'
export * from './overview'

// explicit type exports
export type { QueryCondition, QueryFilter } from './folders'
export type { HttpValidationError, ValidationError } from './activities'
