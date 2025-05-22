import { ProjectModel, useGetProjectQuery } from '@shared/api'
import { createContext, FC, useContext } from 'react'
import router from 'react-router-dom'

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
}

// types for props passed to the provider
export interface AddonProjectContextProps extends RemoteAddonProjectProps {
  children: React.ReactNode
}

// types returned by context
export interface AddonProjectContextType extends RemoteAddonProjectProps {
  project: ProjectModel | undefined
}

const AddonProjectContext = createContext<AddonProjectContextType | undefined>(undefined)

export const AddonProjectProvider = ({
  children,
  projectName,
  ...props
}: AddonProjectContextProps) => {
  const { data: project } = useGetProjectQuery(
    { projectName: projectName as string },
    { skip: !projectName },
  )
  return (
    <AddonProjectContext.Provider value={{ ...props, projectName, project }}>
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
