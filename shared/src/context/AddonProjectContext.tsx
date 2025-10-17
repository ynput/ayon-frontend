// NOT USED IN AYON-FRONTEND, ONLY IN ADDONS

import { ProjectModel, useGetCurrentUserQuery, useGetProjectQuery, UserModel } from '@shared/api'
import { createContext, FC, useContext } from 'react'
import router from 'react-router-dom'
import type { toast } from 'react-toastify'

type ToastFunc = typeof toast

export type RemoteAddonProjectComponent = FC<RemoteAddonProjectProps>
export type RemoteAddonProject = {
  id: string
  component: RemoteAddonProjectComponent
  name: string
  module: string
}

export type RouterTypes = {
  useParams: typeof router.useParams
  useNavigate: typeof router.useNavigate
  useLocation: typeof router.useLocation
  useSearchParams: typeof router.useSearchParams
}

export interface RemoteAddonProjectProps {
  projectName: string
  router: RouterTypes
  toast?: any
}

// types for props passed to the provider
export interface AddonProjectContextProps extends RemoteAddonProjectProps {
  children: React.ReactNode
}

// types returned by context
export interface AddonProjectContextType extends RemoteAddonProjectProps {
  project: ProjectModel | undefined
  user: UserModel | undefined
  toast: ToastFunc
}

const AddonProjectContext = createContext<AddonProjectContextType | undefined>(undefined)

export const AddonProjectProvider = ({
  children,
  projectName,
  // utils
  toast,
  ...props
}: AddonProjectContextProps) => {
  // get current project data
  const { data: project } = useGetProjectQuery(
    { projectName: projectName as string },
    { skip: !projectName },
  )

  // get current user data
  const { data: user } = useGetCurrentUserQuery()
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

export const useAddonProjectContext = () => {
  const context = useContext(AddonProjectContext)
  if (!context) {
    throw new Error('useAddonProjectContext must be used within a AddonProjectContext')
  }
  return context
}
