import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import { api, ListProjectsApiResponse } from '../project'

type listProjectsResult = NonNullable<ListProjectsApiResponse['projects']>

type Definitions = DefinitionsFromApi<typeof api>
export type TagTypes = TagTypesFromApi<typeof api>
// update the definitions to include the new types
export type UpdatedDefinitions = Omit<Definitions, 'listProjects'> & {
  listProjects: OverrideResultType<Definitions['listProjects'], listProjectsResult>
}
