import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button, InputText } from '@ynput/ayon-react-components'
import * as Styled from './Breadcrumbs.styled'

import { upperFirst } from 'lodash'
import useUriNavigate from '/src/hooks/useUriNavigate'

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

  // NAVIGATE TO URI HOOK
  const navigateToUri = useUriNavigate()

  const goThere = async (e) => {
    e?.preventDefault()
    setEditMode(false)
    // blur input
    inputRef.current.blur()

    try {
      await navigateToUri(localUri)
    } catch (error) {
      console.error(error)
      setLocalUri(ctxUri)
    } finally {
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
              style={{ borderRadius: !localUri ? 4 : '4px 0 0 4px' }}
            />
          </label>
        </Styled.CrumbsForm>
        {uriDisplay && localUri && (
          <Button
            icon="content_copy"
            style={{ opacity: editMode ? 0 : 1, width: editMode ? 0 : 'auto' }}
            onClick={onCopy}
            variant="tonal"
          />
        )}
      </Styled.Crumbtainer>
    </Styled.Wrapper>
  )
}

export default Breadcrumbs
