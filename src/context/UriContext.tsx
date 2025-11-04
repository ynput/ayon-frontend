import { createContext, useContext, useEffect, ReactNode, FC } from 'react'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

export const URL_PARAM_ID = 'uri'

interface URIContextValue {
  uri: string
  setUri: (uri: string) => void
}

interface URIProviderProps {
  children: ReactNode
}

const URIContext = createContext<URIContextValue | undefined>(undefined)

const URIProvider: FC<URIProviderProps> = ({ children }) => {
  const pathname = location.pathname

  const [uri, setUri] = useQueryParam(URL_PARAM_ID, withDefault(StringParam, ''))

  // when the scope is outside settings and project, set uri to null
  const scopes = ['projects', 'settings', 'dashboard/tasks']
  useEffect(() => {
    const matchingScope = scopes.some((scope) => pathname.startsWith(`/${scope}`))

    if (!matchingScope) {
      setUri(null)
    }
  }, [pathname, setUri])

  const contextValue: URIContextValue = {
    uri,
    setUri,
  }

  return <URIContext.Provider value={contextValue}>{children}</URIContext.Provider>
}

const useURIContext = (): URIContextValue => {
  const context = useContext(URIContext)
  if (context === undefined) {
    throw new Error('useURIContext must be used within a URIProvider')
  }
  return context
}

export { URIProvider, useURIContext }
