import { createContext, useCallback, useContext, useEffect } from 'react'
import { toast } from 'react-toastify'
import { onUriNavigate, setUri, setUriChanged } from '@state/context'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'

const URIContext = createContext()

function URIProvider({ children }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const pathname = location.pathname

  const focusEntities = (entities) => {
    const focused = {
      folders: [],
      products: [],
      versions: [],
      tasks: [],
      workfiles: [],
    }

    const project = entities[0].projectName

    // assert we current url starts with projects/<projectName>
    // if not, redirect

    for (const entity of entities) {
      if (entity.folderId) focused.folders.push(entity.folderId)
      if (entity.productId) focused.products.push(entity.productId)
      if (entity.versionId) focused.versions.push(entity.versionId)
      if (entity.taskId) focused.tasks.push(entity.taskId)
      if (entity.workfileId) focused.workfiles.push(entity.workfileId)

      if (entity.projectName !== project) {
        toast.error('Entities must be from the same project')
        continue
      }
    }

    const focusedTypePriorityOrder = [
      'folder',
      'task',
      'product',
      'version',
      'representation',
      'workfile',
    ]

    const focusedType = focusedTypePriorityOrder.findLast((type) => {
      return focused[type + 's'].length > 0
    })

    focused.type = focusedType

    dispatch(onUriNavigate(focused))

    const path = window.location.pathname
    if (!path.startsWith(`/projects/${project}`) && !path.startsWith(`/dashboard/tasks`)) {
      navigate(`/projects/${project}/browser`)
    }
  }

  const navigateToUri = useCallback(
    async (localUri) => {
      if (!localUri) return null

      if (['ayon', 'ayon+entity'].includes(localUri.split('://')[0])) {
        try {
          const res = await axios.post('/api/resolve', { uris: [localUri] })

          if (!res.data.length) {
            toast.error('Could not resolve uri')
            return
          }
          const entities = res.data[0].entities
          if (!entities.length) {
            // toast.error('No entities found')
            return
          }
          focusEntities(entities)
          setTimeout(() => {
            dispatch(setUri(res.data[0].uri))
          }, 100)
          return res.data[0].uri
        } catch (error) {
          toast.error(error)
          return null
        }
      } else if (localUri.startsWith('ayon+settings')) {
        //split query params

        const [baseUri, query] = localUri.split('://')[1].split('?')

        // extract addon name and version from uri
        // ayon+settings://<addonName>:<addonVersion>/<settingsPathIncludingMoreSlashes>

        const [addonStr, ...settingsPath] = baseUri.split('/')
        const [addonName, addonVersion] = addonStr.split(':')

        // parse query params

        const qp = {}
        if (query) {
          for (const param of query.split('&')) {
            const [key, value] = param.split('=')
            qp[key] = value
          }
        }

        let targetUrl = ''

        if ('project' in qp && 'site' in qp)
          targetUrl = `manageProjects/siteSettings?${qp.project}&site=${qp.site}&`
        else if ('project' in qp)
          targetUrl = `manageProjects/projectSettings?project=${qp.project}&`
        else if ('site' in qp) targetUrl = `settings/site?site=${qp.site}&`
        else targetUrl = `settings/studio?`

        targetUrl += `addonName=${addonName}`
        if (addonVersion) targetUrl += `&addonVersion=${addonVersion}`
        if (settingsPath?.length) targetUrl += `&settingsPath=${settingsPath.join('|')}`

        navigate(targetUrl)
        dispatch(setUri(localUri))
        dispatch(setUriChanged())
      } else {
        toast.error('Invalid uri')
        return null
      }
    },
    [dispatch],
  )

  //   when the scope is outside settings and project, set uri to null
  const scopes = ['projects', 'settings', 'dashboard/tasks']
  useEffect(() => {
    const matchingScope = scopes.some((scope) => pathname.startsWith(`/${scope}`))

    if (!matchingScope) {
      dispatch(setUri(null))
    }
  }, [pathname])

  return <URIContext.Provider value={{ navigate: navigateToUri }}>{children}</URIContext.Provider>
}

const useURIContext = () => useContext(URIContext)

export { URIProvider, useURIContext }
