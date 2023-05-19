import axios from 'axios'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { InputText, Button } from '@ynput/ayon-react-components'

import {
  setFocusedFolders,
  setFocusedSubsets,
  setFocusedVersions,
  setUri,
} from '/src/features/context'

import styled from 'styled-components'

const Crumbtainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;

  ul {
    list-style: none;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    margin: 0;
    padding: 0;

    & > li {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4em;

      &:not(:last-child) {
        &::after {
          margin: 0 5px;
          content: '/';
        }
      }
    }
  }
`

const Breadcrumbs = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [localUri, setLocalUri] = useState('')
  const ctxUri = useSelector((state) => state.context.uri) || ''

  const focusEntities = (entities) => {
    const focusedFolders = []
    const focusedSubsets = []
    const focusedVersions = []

    const project = entities[0].projectName

    // assert we current url starts with projects/<projectName>
    // if not, redirect

    const path = window.location.pathname
    if (!path.startsWith(`/projects/${project}`)) {
      navigate(`/projects/${project}/browser`)
    }

    for (const entity of entities) {
      if (entity.folderId) focusedFolders.push(entity.folderId)
      if (entity.subsetId) focusedSubsets.push(entity.subsetId)
      if (entity.versionId) focusedVersions.push(entity.versionId)

      if (entity.projectName !== project) {
        toast.error('Entities must be from the same project')
        continue
      }
    }

    dispatch(setFocusedFolders(focusedFolders))
    dispatch(setFocusedSubsets(focusedSubsets))
    dispatch(setFocusedVersions(focusedVersions))
  }

  const goThere = () => {
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
  }

  useEffect(() => {
    if (ctxUri === localUri) return
    setLocalUri(ctxUri)
  }, [ctxUri])

  return (
    <Crumbtainer>
      <InputText
        value={localUri}
        onChange={(e) => setLocalUri(e.target.value)}
        style={{ width: 800 }}
      />
      <Button onClick={() => goThere()}>Go</Button>
    </Crumbtainer>
  )
}

export default Breadcrumbs
