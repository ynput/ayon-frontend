import { useCallback } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import {
  setFocusedFolders,
  setFocusedProducts,
  setFocusedRepresentations,
  setFocusedTasks,
  setFocusedVersions,
  setFocusedWorkfiles,
  setUri,
  setUriChanged,
} from '/src/features/context'
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'

const useUriNavigate = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const focusEntities = (entities) => {
    const focusedFolders = []
    const focusedProducts = []
    const focusedVersions = []
    const focusedRepresentations = []
    const focusedTasks = []
    const focusedWorkfiles = []

    const project = entities[0].projectName

    // assert we current url starts with projects/<projectName>
    // if not, redirect

    for (const entity of entities) {
      if (entity.folderId) focusedFolders.push(entity.folderId)
      if (entity.productId) focusedProducts.push(entity.productId)
      if (entity.versionId) focusedVersions.push(entity.versionId)
      if (entity.representationId) focusedRepresentations.push(entity.representationId)
      if (entity.taskId) focusedTasks.push(entity.taskId)
      if (entity.workfileId) focusedWorkfiles.push(entity.workfileId)

      if (entity.projectName !== project) {
        toast.error('Entities must be from the same project')
        continue
      }
    }

    dispatch(setFocusedFolders(focusedFolders))
    dispatch(setFocusedProducts(focusedProducts))
    dispatch(setFocusedVersions(focusedVersions))
    dispatch(setFocusedRepresentations(focusedRepresentations))
    dispatch(setFocusedTasks(focusedTasks))
    dispatch(setFocusedWorkfiles(focusedWorkfiles))

    const path = window.location.pathname
    if (!path.startsWith(`/projects/${project}`)) {
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
            toast.error('No entities found')
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

        if ('project' in qp && 'site' in qp) {
          targetUrl = `manageProjects/siteSettings?`
          targetUrl += `project=${qp.project}&site=${qp.site}`
          targetUrl += `&addonName=${addonName}&addonVersion=${addonVersion}`
          targetUrl += `&settingsPath=${settingsPath.join('|')}`
        } else if ('project' in qp) {
          targetUrl = `manageProjects/projectSettings?`
          targetUrl += `project=${qp.project}`
          targetUrl += `&addonName=${addonName}&addonVersion=${addonVersion}`
          targetUrl += `&settingsPath=${settingsPath.join('|')}`
        } else if ('site' in qp) {
          targetUrl = `settings/site?`
          targetUrl += `site=${qp.site}`
          targetUrl += `&addonName=${addonName}&addonVersion=${addonVersion}`
          targetUrl += `&settingsPath=${settingsPath.join('|')}`
        } else {
          targetUrl = `settings/studio`
          targetUrl += `?addonName=${addonName}&addonVersion=${addonVersion}`
          targetUrl += `&settingsPath=${settingsPath.join('|')}`
        }

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

  return navigateToUri
}

export default useUriNavigate
