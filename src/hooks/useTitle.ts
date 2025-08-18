import { useMemo, ReactNode } from 'react'

type Link = {
  name?: string
  module?: string
  path?: string
  enabled?: boolean
  uriSync?: boolean
  viewType?: string
  node?: ReactNode | string
}

const useTitle = (
    currentModule: string,
    links: Link[],
    basePage: string = '',
    pagePrefix: string | null = null
): string => {
  return useMemo(() => {
    if (!currentModule || !links) {
      return basePage
    }

    const currentLink = links.find(link => link.module === currentModule)
    const pageName = currentLink?.name || basePage

    if (pagePrefix) {
      return basePage ? `${pagePrefix} • ${pageName} • ${basePage}` : `${pagePrefix} • ${pageName}`
    }

    return basePage ? `${pageName} • ${basePage}` : pageName
  }, [currentModule, links, basePage, pagePrefix])
}

export default useTitle
