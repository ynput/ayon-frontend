// NOT USED IN AYON-FRONTEND, ONLY IN ADDONS

import { ProjectModel, useGetProjectQuery, UserModel } from '@shared/api'
import { createContext, FC, useContext } from 'react'
import type { toast } from 'react-toastify'
import { useGlobalContext } from './GlobalContext'
import { RemotePageProps } from '@shared/components'

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

const AddonProjectContext = createContext<AddonProjectContextType | undefined>(undefined)

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

export const useAddonProjectContext = () => {
  const context = useContext(AddonProjectContext)
  if (!context) {
    throw new Error('useAddonProjectContext must be used within a AddonProjectContext')
  }
  return context
}
