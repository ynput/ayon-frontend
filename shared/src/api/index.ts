// re-export the base api and graphql api
export * from '../client'
// re-export the base api and graphql api and override api exports from generated files that also export api
export { api } from '../client'
// export all rest api slices and queries
export * from './activities'
export { api as activitiesApi } from './activities'
export * from './modules'
export { api as modulesApi } from './modules'
export * from './auth'
export { api as authApi } from './auth'

// explicit type exports
export type { HttpValidationError, ValidationError } from './activities'
