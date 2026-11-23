// The host's ProjectList from @ynput/ayon-addon (registered in addonHost.ts): shared's, with what
// lives in the app (routes, store, permissions). StudioPageLayout and the project page ones are
// in shared (AddonLayout).
import { useQueryParam } from 'use-query-params'
import type { ProjectListProps } from '@ynput/ayon-addon'
import { ProjectListHost } from '@shared/components/AddonLayout/StudioPageLayout'
import { useProjectsListAppProps } from '@containers/ProjectsList/useProjectsListAppProps'

export const AppProjectListHost = (props: ProjectListProps) => {
  const appProps = useProjectsListAppProps()
  // the search stays in the URL, as on AYON's own pages
  const [search, setSearch] = useQueryParam<undefined | string>('project_search')
  return <ProjectListHost search={search} onSearch={setSearch} {...appProps} {...props} />
}
