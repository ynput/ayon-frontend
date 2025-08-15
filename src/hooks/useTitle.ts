import { useMemo, ReactNode } from 'react'

type Link = {
  name: string
  module: string
  path?: string
  enabled?: boolean
  uriSync?: boolean
  viewType?: string
  node?: ReactNode | string
}

const useTitle = (
  currentModule: string,
  links: Link[],
  basePage: string = 'AYON',
  pagePrefix: string | null = null
): string => {
  return useMemo(() => {
    if (!currentModule || !links) {
      return basePage
    }

    const currentLink = links.find(link => link.module === currentModule)
    const pageName = currentLink ? currentLink.name : basePage

    if (pagePrefix) {
      return `${pagePrefix} • ${pageName} • ${basePage}`
    }

    return `${pageName} • ${basePage}`
  }, [currentModule, links, basePage, pagePrefix])
}

export default useTitle
