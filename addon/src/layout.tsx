import type { ReactNode } from 'react'
import { getHost } from './hostBridge'

// Layout components: the host owns the state (slicer selection, selected projects, panel sizes,
// saved per page like its own pages), the addon decides where they go. Each renders the host's
// implementation, registered with provideHost.

export interface ProjectPageLayoutProps {
  /** the left panel, usually `<Slicer fields={[...]} />` */
  sidebar?: ReactNode
  children: ReactNode
}

export interface SlicerProps {
  /** which slice types the slicer offers: `hierarchy`, `assignees`, `status`, `taskType`, ... */
  fields: string[]
}

export interface StudioPageLayoutProps {
  /** the left panel, usually `<ProjectList />` */
  sidebar?: ReactNode
  children: ReactNode
}

export interface ProjectListProps {
  /** let the user select several projects */
  multiSelect?: boolean
}

const Missing = ({ name }: { name: string }) => (
  <div role="alert" className="ayon-addon-error">
    {name} is not available in this AYON frontend.
  </div>
)

/** A project page with a sidebar (the slicer) and the page content, sized like built-in pages. */
export const ProjectPageLayout = (props: ProjectPageLayoutProps) => {
  const Host = getHost().components?.ProjectPageLayout
  return Host ? <Host {...props} /> : <Missing name="ProjectPageLayout" />
}

/** The project page's slicer. Its selection is in the page's context: `useSlot('project.page').slicer`. */
export const Slicer = (props: SlicerProps) => {
  const Host = getHost().components?.Slicer
  return Host ? <Host {...props} /> : <Missing name="Slicer" />
}

/** A studio page with a sidebar (the project list) and the page content. */
export const StudioPageLayout = (props: StudioPageLayoutProps) => {
  const Host = getHost().components?.StudioPageLayout
  return Host ? <Host {...props} /> : <Missing name="StudioPageLayout" />
}

/** The studio page's project list. Its selection is `useSlot('studio.page').selectedProjects`. */
export const ProjectList = (props: ProjectListProps) => {
  const Host = getHost().components?.ProjectList
  return Host ? <Host {...props} /> : <Missing name="ProjectList" />
}
