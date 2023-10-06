import axios from 'axios'
import { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { InputText } from '@ynput/ayon-react-components'
import * as Styled from './Breadcrumbs.styled'
import HeaderButton from '../header/HeaderButton'

import {
  setFocusedFolders,
  setFocusedProducts,
  setFocusedVersions,
  setFocusedRepresentations,
  setFocusedTasks,
  setFocusedWorkfiles,
  setUri,
  setUriChanged,
} from '/src/features/context'
import { upperFirst } from 'lodash'

const uri2crumbs = (uri = '', pathname) => {
  // parse uri to path and query params
  const [scope, pathAndQuery = ''] = uri.split('://')
  const [path, query] = pathAndQuery.split('?')
  const crumbs = path.split('/').filter((crumb) => crumb)

  if (scope?.includes('ayon+settings')) {
    let settingsScope = ''
    if (query?.includes('project')) {
      settingsScope = 'Projects Manager'
    } else {
      settingsScope = 'Studio Settings'
    }

    crumbs.unshift(settingsScope)
  } else if (scope?.includes('ayon+entity')) {
    crumbs.unshift('Project')
  } else {
    // anything that doesn't have a uri
    let pageTitle = pathname.split('/')[1]

    if (pageTitle.includes('settings')) pageTitle = 'Studio Settings'
    else if (pageTitle.includes('manageProjects')) pageTitle = 'Projects Manager'
    // just a regular url
    crumbs.unshift(upperFirst(pageTitle))
  }

  const qp = {}

  if (query) {
    const params = query.split('&')
    for (const param of params) {
      const [key, value] = param.split('=')
      qp[key] = value
    }
  }

  for (const level of ['product', 'task', 'workfile', 'version', 'representation']) {
    if (qp[level]) {
      crumbs.push(qp[level])
    }
  }

  return crumbs
}

const Breadcrumbs = () => {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [localUri, setLocalUri] = useState('')
  const [editMode, setEditMode] = useState(false)
  const ctxUri = useSelector((state) => state.context.uri) || ''

  const inputRef = useRef(null)

  //   when editing, select all text
  useEffect(() => {
    if (!editMode) return
    inputRef.current.select()

    // reselect to counter mouse movement
    const timeout = setTimeout(() => {
      inputRef.current.select()
    }, 50)

    // reselect again to really make sure
    const timeout2 = setTimeout(() => {
      inputRef.current.select()
    }, 400)

    return () => {
      clearTimeout(timeout)
      clearTimeout(timeout2)
    }
  }, [editMode])

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

    const path = window.location.pathname
    if (!path.startsWith(`/projects/${project}`)) {
      navigate(`/projects/${project}/browser`)
    }

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
    dispatch(setFocusedTasks({ ids: focusedTasks }))
    dispatch(setFocusedWorkfiles(focusedWorkfiles))
  }

  const goThere = (e) => {
    e?.preventDefault()
    setEditMode(false)
    // blur input
    inputRef.current.blur()

    if (!localUri) return

    if (['ayon', 'ayon+entity'].includes(localUri.split('://')[0])) {
      axios
        .post('/api/resolve', { uris: [localUri] })
        .then((res) => {
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
        })
        .catch((err) => {
          toast.error(err)
        })
        .finally(() => {
          setEditMode(false)
        })
    } else if (localUri.startsWith('ayon+settings')) {
      setEditMode(false)

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
      setEditMode(false)
    } else {
      toast.error('Invalid uri')
      setLocalUri(ctxUri)
      setEditMode(false)
    }
  }

  const onCopy = () => {
    navigator.clipboard.writeText(localUri)
    toast.success('Copied to clipboard')
  }

  const handleKeyDown = (e) => {
    // if escape, cancel edit mode
    if (e.key === 'Escape') {
      setEditMode(false)
      setLocalUri(ctxUri)
      inputRef.current.blur()
    }
  }

  useEffect(() => {
    if (ctxUri === localUri) return
    setLocalUri(ctxUri)
  }, [ctxUri])

  const uriDisplay = uri2crumbs(ctxUri, location.pathname).join(' / ')
  const inputValue = editMode ? localUri : uriDisplay || 'Go to URI...'

  return (
    <Styled.Wrapper>
      <Styled.Crumbtainer>
        <Styled.CrumbsForm onSubmit={goThere}>
          <label data-value={inputValue}>
            <InputText
              value={inputValue}
              onChange={(e) => setLocalUri(e.target.value)}
              onBlur={() => setEditMode(false)}
              onFocus={() => setEditMode(true)}
              onKeyDown={handleKeyDown}
              ref={inputRef}
            />
          </label>
        </Styled.CrumbsForm>
        {uriDisplay && localUri && (
          <HeaderButton
            icon="content_copy"
            style={{ opacity: editMode ? 0 : 1, width: editMode ? 0 : 'auto' }}
            onClick={onCopy}
            variant="text"
          />
        )}
      </Styled.Crumbtainer>
    </Styled.Wrapper>
  )
}

export default Breadcrumbs
