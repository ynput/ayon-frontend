import { useNavigate, useParams } from 'react-router-dom'
import { useAppSelector } from '@/features/store'
import { useEffect, useMemo } from 'react'
import { ayonUrlParam } from '@/constants'

type AccessLevel = 'manager' | 'admin'

export type NavLinkItem = {
  name: string
  path: string
  module: string
  uriSync?: boolean
  enabled?: boolean
  accessLevels?: AccessLevel[]
  shortcut?: string
  tooltip?: string
  startContent?: React.ReactNode
  endContent?: React.ReactNode
}


/**
 * Custom hook for filtering navigation links based on user access levels,
 * appending URI parameters, and redirecting unauthorized users.
 */
export const useAppNavLinks = (items: NavLinkItem[]) => {
  const navigate = useNavigate()
  const { module } = useParams<{ module?: string }>()
  const uri = useAppSelector(state => state.context.uri)
  const isManager = useAppSelector(state => state.user.data.isManager)
  const isAdmin = useAppSelector(state => state.user.data.isAdmin)

  // access logic in one place
 const access = {
  manager: isManager || isAdmin,
  admin: isAdmin,
  }

  // filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (item.enabled === false) return false
      if (item.accessLevels?.length) {
        return item.accessLevels.every(level => access[level])
      }
      return true
    })
  }, [items, access])

  // appendUri helper
  const appendUri = (path: string, shouldAddUri = true) => {
    if (!path) return path
    const [basePath, queryString] = path.split('?')
    const params = new URLSearchParams(queryString || '')
    if (shouldAddUri && uri) {
      params.set(ayonUrlParam, encodeURIComponent(uri))
    }
    const newQueryString = params.toString()
    return newQueryString ? `${basePath}?${newQueryString}` : basePath
  }

 // redirect effect inside hook
  useEffect(() => {
    if (!module) return
    const current = items.find(item => item.module === module)
    if (!current) return

    const hasAccess = !current.accessLevels?.length || current.accessLevels.every(level => access[level])
    if (hasAccess) return

    // Fallback to first accessible item, or home if none
    const fallback = items.find(item => item.accessLevels?.every(level => access[level]))
    navigate(fallback?.path || '/', { replace: true })
  }, [module, items, access, navigate])

  return { filteredItems, appendUri }
}
