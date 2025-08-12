import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTitleContext } from '@context/TitleContext'

type LinkLike = Partial<{
  name: string
  module: string
}> & Record<string, any>

type UseTitleOptions = {
  page?: string
  project?: string
  entity?: string
  links?: LinkLike[]
  paramKey?: string // default: 'module'
}


const useTitle = (options: UseTitleOptions = {}) => {
  const { setTitleParts } = useTitleContext()
  const { page, project, entity, links, paramKey = 'module' } = options
  const params = useParams()

  // Auto-resolve page if links are provided
  const resolvedPage = (() => {
    if (links) {
      const validLinks = links.filter(
          (l): l is { name: string; module: string } =>
              typeof l.name === 'string' && typeof l.module === 'string',
      )
      const match = validLinks.find(link => link.module === params[paramKey])
      return match?.name || 'Ayon'
    }
    return page
  })()

  useEffect(() => {
    setTitleParts({
      page: resolvedPage || '',
      project: project || '',
      entity: entity || '',
    })
  }, [resolvedPage, project, entity, setTitleParts])
}

export default useTitle
