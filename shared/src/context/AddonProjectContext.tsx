// NOT USED IN AYON-FRONTEND, ONLY IN ADDONS

import { useGetProjectQuery } from '@shared/api/queries/project/getProject'
import type { ProjectModel, UserModel } from '@shared/api/generated'
import { FC } from 'react'
import type { toast } from 'react-toastify'
import { useGlobalContext } from './GlobalContextInstance'
import type { RemotePageProps } from '@shared/components/RemotePage/RemotePageWrapper'
import { AddonProjectContext } from './AddonProjectContextInstance'

type ToastFunc = typeof toast

export interface RemoteAddonProjectProps extends RemotePageProps {}

export type RemoteAddonProjectComponent = FC<RemoteAddonProjectProps>
export type RemoteAddonProject = {
  id: string
  component: RemoteAddonProjectComponent
  name: string
  module: string
  viewType?: string // if the addon is using views
  slicer?: { fields: string[] }
}

// types for props passed to the provider
export interface AddonProjectContextValue extends RemoteAddonProjectProps {
  children: React.ReactNode
}

// types returned by context
export interface AddonProjectContextType extends RemoteAddonProjectProps {
  project: ProjectModel | undefined
  user: UserModel | undefined
  toast: ToastFunc
}

export const AddonProjectProvider = ({
  children,
  projectName,
  // utils
  toast,
  ...props
}: AddonProjectContextValue) => {
  // get current project data
  const { data: project } = useGetProjectQuery(
    { projectName: projectName as string },
    { skip: !projectName },
  )

  const { user } = useGlobalContext()

  return (
    <AddonProjectContext.Provider
      value={{
        ...props,
        projectName,
        project,
        user,
        toast,
      }}
    >
      {children}
    </AddonProjectContext.Provider>
  )
}
