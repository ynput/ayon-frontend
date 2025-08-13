import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Button, InputText } from '@ynput/ayon-react-components'
import * as Styled from './Breadcrumbs.styled'

import { copyToClipboard } from '@shared/util'
import { useURIContext } from '@context/UriContext'
import { ayonUrlParam } from '@/constants'
import clsx from 'clsx'
import { uri2crumbs } from '@/utils/breadcrumbs'

const Breadcrumbs = () => {
  const location = window.location

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
    if (['Escape', 'Enter'].includes(e.key)) {
      setEditMode(false)
      setLocalUri(ctxUri)
      inputRef.current.blur()
    }
    if (e.key === 'Enter') {
      goThere(e)
    }
  }

  useEffect(() => {
    if (ctxUri !== localUri) {
      setLocalUri(ctxUri)
    }

    const urlParams = new URLSearchParams(window.location.search)
    const encodedAyonEntity = urlParams.get(ayonUrlParam)
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
        <Styled.CrumbsForm onSubmit={goThere} className={clsx({ noUri: !uriDisplay || !localUri })}>
          {uriDisplay && localUri && (
            <Button
              icon="edit"
              style={{
                padding: editMode ? 0 : '6px',
                opacity: editMode ? 0 : 1,
                width: editMode ? 0 : 'auto',
              }}
              onClick={(e) => {
                e.preventDefault()
                setEditMode(true)
              }}
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
              style={{ borderRadius: '4px 0 0 4px' }}
            />
          </label>
          <Button
            icon="arrow_forward"
            style={{
              display: editMode ? 'inline-flex' : 'none',
              borderRadius: '0 4px 4px 0',
            }}
            onMouseDown={goThere}
            variant="tonal"
          />
        </Styled.CrumbsForm>
        {uriDisplay && localUri && (
          <Button
            icon="content_copy"
            style={{ display: editMode ? 'none' : 'inline-flex' }}
            onClick={onCopy}
            variant="tonal"
          />
        )}
      </Styled.Crumbtainer>
    </Styled.Wrapper>
  )
}

export default Breadcrumbs
