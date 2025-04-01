import { useGetSiteInfoQuery } from '@queries/auth/getAuth'
import { useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'
import React, { createContext, useContext, ReactNode, useCallback } from 'react'

type HelpContextType = {
  buildUrl: (openHelp?: boolean) => string
}

const HelpContext = createContext<HelpContextType | undefined>(undefined)

type HelpProviderProps = {
  children: ReactNode
}

const BASE_API =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080/auth/feedback'
    : 'https://ynput.cloud/auth/feedback'

export const HelpProvider: React.FC<HelpProviderProps> = ({ children }) => {
  const { data: info } = useGetSiteInfoQuery({ full: true })
  const { user } = info || {}

  const { data: cloud } = useGetYnputCloudInfoQuery()
  const { instanceId, orgId } = cloud || {}

  const buildSSOUrl = (openHelp?: boolean) => {
    // build url with params
    const url = new URL(BASE_API)
    url.searchParams.set('email', user?.attrib?.email || '')
    url.searchParams.set('full_name', user?.attrib?.fullName || '')
    url.searchParams.set('instance_id', instanceId || '')
    url.searchParams.set('org_id', orgId || '')

    return url.toString()
  }

  const buildUrl: HelpContextType['buildUrl'] = useCallback(
    (openHelp) => {
      const url = buildSSOUrl(openHelp)

      return url
    },
    [user, instanceId, orgId],
  )

  return <HelpContext.Provider value={{ buildUrl }}>{children}</HelpContext.Provider>
}

export const useHelp = (): HelpContextType => {
  const context = useContext(HelpContext)
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider')
  }
  return context
}
