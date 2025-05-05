import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import { projectsApi, ListProjectsApiResponse } from '@shared/api/generated'

type listProjectsResult = NonNullable<ListProjectsApiResponse['projects']>

type Definitions = DefinitionsFromApi<typeof projectsApi>
export type TagTypes = TagTypesFromApi<typeof projectsApi>
// update the definitions to include the new types
export type UpdatedDefinitions = Omit<Definitions, 'listProjects'> & {
  listProjects: OverrideResultType<Definitions['listProjects'], listProjectsResult>
}
