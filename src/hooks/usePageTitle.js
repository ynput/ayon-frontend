import { useMemo } from 'react'

const usePageTitle = (currentModule, links, basePage = 'AYON', pagePrefix = null) => {
  const title = useMemo(() => {
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

  return title
}

export default usePageTitle
