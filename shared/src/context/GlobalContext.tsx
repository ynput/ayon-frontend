import { createContext, useContext, ReactNode, useEffect } from 'react'
import {
  useGetSiteInfoQuery,
  GetSiteInfoResult,
  useGetCurrentUserQuery,
  GetCurrentUserApiResponse,
  useGetYnputCloudInfoQuery,
  GetYnputCloudInfoApiResponse,
  AttributeModel,
} from '@shared/api'

type GlobalContextType = {
  siteInfo: GetSiteInfoResult | undefined
  attributes: AttributeModel[]
  user: GetCurrentUserApiResponse | undefined
  cloudInfo: GetYnputCloudInfoApiResponse | undefined
  isLoading: {
    siteInfo: boolean
    user: boolean
    cloudInfo: boolean
  }
  error: {
    siteInfo: any
    user: any
    cloudInfo: any
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
        isLoading: {
          siteInfo: isLoading,
          user: isLoadingUser,
          cloudInfo: isLoadingCloud,
        },
        error: {
          siteInfo: error,
          user: userError,
          cloudInfo: cloudError,
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
