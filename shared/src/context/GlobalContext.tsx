import { createContext, useContext, ReactNode, useMemo } from 'react'
import {
  useGetSiteInfoQuery,
  GetSiteInfoResult,
  useGetCurrentUserQuery,
  GetCurrentUserApiResponse,
  useGetYnputCloudInfoQuery,
  GetYnputCloudInfoApiResponse,
  AttributeModel,
  ListProjectsItemModel,
  useListProjectsQuery,
} from '@shared/api'

type GlobalProjects = {
  all: ListProjectsItemModel[]
  active: ListProjectsItemModel[]
}

type GlobalContextType = {
  siteInfo: GetSiteInfoResult | undefined
  attributes: AttributeModel[]
  user: GetCurrentUserApiResponse | undefined
  cloudInfo: GetYnputCloudInfoApiResponse | undefined
  projects: GlobalProjects
  isLoading: {
    siteInfo: boolean
    user: boolean
    cloudInfo: boolean
    projects: boolean
  }
  error: {
    siteInfo: any
    user: any
    cloudInfo: any
    projects: any
  }
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined)

type Props = {
  children: ReactNode
  skip?: boolean
}

export const GlobalProvider = ({ children, skip = false }: Props) => {
  const { data: siteInfo, isLoading, error } = useGetSiteInfoQuery({ full: true }, { skip })
  const { data: user, isLoading: isLoadingUser, error: userError } = useGetCurrentUserQuery()
  const {
    data: allProjects = [],
    isLoading: isLoadingAllProjects,
    error: allProjectsError,
  } = useListProjectsQuery({}, { skip })
  const activeProjects = useMemo(() => allProjects.filter((p) => p.active), [allProjects])

  //   wait until user is logged in
  const {
    data: cloudInfo,
    isLoading: isLoadingCloud,
    error: cloudError,
  } = useGetYnputCloudInfoQuery(undefined, { skip: !user?.name })

  return (
    <GlobalContext.Provider
      value={{
        siteInfo,
        attributes: siteInfo?.attributes || [],
        user,
        cloudInfo,
        projects: {
          all: allProjects,
          active: activeProjects,
        },
        isLoading: {
          siteInfo: isLoading,
          user: isLoadingUser,
          cloudInfo: isLoadingCloud,
          projects: isLoadingAllProjects,
        },
        error: {
          siteInfo: error,
          user: userError,
          cloudInfo: cloudError,
          projects: allProjectsError,
        },
      }}
    >
      {children}
    </GlobalContext.Provider>
  )
}

export const useGlobalContext = () => {
  const context = useContext(GlobalContext)

  if (context === undefined) {
    throw new Error('useGlobalContext must be used within a GlobalProvider')
  }

  return context
}
