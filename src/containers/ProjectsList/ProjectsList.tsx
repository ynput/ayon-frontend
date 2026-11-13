// The shared project list with what lives in the app: routes, store, permissions, and the search
// in the URL.
import { useQueryParam } from 'use-query-params'
import { ProjectsList as SharedProjectsList } from '@shared/containers/ProjectsTable'
import type { ProjectsListProps } from '@shared/containers/ProjectsTable'
import { useProjectsListAppProps } from './useProjectsListAppProps'

const ProjectsList = (props: ProjectsListProps) => {
  const appProps = useProjectsListAppProps()
  const [search, setSearch] = useQueryParam<undefined | string>('project_search')
  return <SharedProjectsList search={search} onSearch={setSearch} {...appProps} {...props} />
}

export default ProjectsList
