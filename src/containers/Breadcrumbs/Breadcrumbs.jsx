import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Button, InputText } from '@ynput/ayon-react-components'
import * as Styled from './Breadcrumbs.styled'

import { upperFirst } from 'lodash'
import copyToClipboard from '@helpers/copyToClipboard'
import { useURIContext } from '@context/uriContext'
import { ayonUrlParam } from '@/constants'

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
  } else if (scope?.includes('ayon+anatomy')) {
    if (scope === 'ayon+anatomy') crumbs.unshift('Project anatomy')
    else crumbs.unshift('Anatomy preset')
  } else {
    // anything that doesn't have a uri
    let pageTitle = pathname.split('/')[1]

    if (pageTitle.includes('settings')) pageTitle = 'Studio Settings'
    else if (pageTitle.includes('manageProjects')) pageTitle = 'Projects Manager'
    // just a regular url (use last part of pathname)
    crumbs.unshift(
      ...pathname
        .slice(1)
        .split('/')
        .map((p) => upperFirst(p)),
    )
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
  const { navigate } = useURIContext()

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

  const goThere = async (e) => {
    e?.preventDefault()
    setEditMode(false)
    // blur input
    inputRef.current.blur()

    try {
      await navigate(localUri)
    } catch (error) {
      console.error(error)
      setLocalUri(ctxUri)
    } finally {
      setEditMode(false)
    }
  }

  const onCopy = () => {
    copyToClipboard(localUri)
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
    if (ctxUri !== localUri) {
      setLocalUri(ctxUri)
    }

    const urlParams = new URLSearchParams(window.location.search)
    const encodedAyonEntity = urlParams.get(ayonUrlParam);
    if (encodedAyonEntity !== null) {
      const ayonEntity = decodeURIComponent(encodedAyonEntity)
      if (ayonEntity != ctxUri) {
        navigate(ayonEntity)
      }
    }
  }, [ctxUri])

  const uriDisplay = uri2crumbs(ctxUri, location.pathname).join(' / ')
  const inputValue = editMode ? localUri : uriDisplay || 'Go to URI...'

  return (
    <Styled.Wrapper>
      <Styled.Crumbtainer>
        <Styled.CrumbsForm onSubmit={goThere}>
          {uriDisplay && localUri && (
            <Button
              icon="edit"
              style={{
                padding: editMode ? 0 : '6px',
                opacity: editMode ? 0 : 1,
                width: editMode ? 0 : 'auto',
              }}
              onClick={() => setEditMode(true)}
              variant="tonal"
            />
          )}
          <label data-value={inputValue}>
            <InputText
              value={inputValue}
              onChange={(e) => setLocalUri(e.target.value)}
              onBlur={() => setEditMode(false)}
              onFocus={() => setEditMode(true)}
              onKeyDown={handleKeyDown}
              ref={inputRef}
              style={{ borderRadius: !localUri ? 4 : 0 }}
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
