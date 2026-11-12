// The host's ProjectList from @ynput/ayon-addon (registered in addonHost.ts): shared's, with what
// lives in the app (routes, store, permissions). StudioPageLayout and the project page ones are
// in shared (AddonLayout).
import type { ProjectListProps } from '@ynput/ayon-addon'
import { ProjectListHost } from '@shared/components/AddonLayout/StudioPageLayout'
import { useProjectsListAppProps } from '@containers/ProjectsList/useProjectsListAppProps'

export const AppProjectListHost = (props: ProjectListProps) => (
  <ProjectListHost {...useProjectsListAppProps()} {...props} />
)
