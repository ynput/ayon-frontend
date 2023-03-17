import React from 'react'
import PropTypes from 'prop-types'
import { Dialog } from 'primereact/dialog'
import { camelCase, capitalize } from 'lodash'
import { useState } from 'react'
import { useEffect } from 'react'
import { InputText, Button } from '@ynput/ayon-react-components'
import { useRef } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import TypeEditor from './TypeEditor'

const ContentStyled = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const NewEntity = ({ type, data = {}, visible, onConfirm, onHide }) => {
  const [entityType, setEntityType] = useState(null)
  //   build out form state
  const initData = { name: '', type: '' }
  const [entityData, setEntityData] = useState(initData)

  //   format title
  let isRoot
  if (Array.isArray(data.parentIds)) {
    isRoot = data.parentIds.includes('root')
  }
  let title = 'Creating New '
  if (isRoot) title += 'Root '
  title += capitalize(type)

  //   type selector
  const tasks = useSelector((state) => state.project.tasks)
  const folders = useSelector((state) => state.project.folders)
  const typeOptions = type === 'folder' ? folders : tasks

  //   refs
  const nameRef = useRef(null)

  // set entity type
  useEffect(() => {
    if (type) {
      setEntityType(type)
      //   prefill any extra data
      setEntityData({ ...entityData, ...data })
    }
  }, [type, visible])

  // handlers

  const handleChange = (value, id) => {
    if (id) {
      setEntityData({ ...entityData, [id]: value })
    }
  }

  const handleShow = () => {
    // focus name input
    nameRef.current?.focus()
  }

  const handleSubmit = (e) => {
    console.log('subbing')
    e?.preventDefault()

    // convert type to correct key
    // convert name to camelCase
    const newData = {
      ...entityData,
      [`${type}Type`]: entityData.type,
      name: camelCase(entityData.name),
    }

    // clear states
    setEntityType(null)
    setEntityData(initData)

    // callbacks
    onConfirm(entityType, isRoot, newData)
    onHide()
  }

  if (!entityType) return null

  return (
    <Dialog
      header={title}
      visible={visible}
      onHide={onHide}
      onShow={handleShow}
      resizable={false}
      draggable={false}
      footer={
        <Button
          label={`Create ${capitalize(type)}`}
          onClick={handleSubmit}
          style={{ marginLeft: 'auto' }}
        />
      }
    >
      <ContentStyled>
        <form onSubmit={handleSubmit}>
          <InputText
            value={entityData.name}
            onChange={(e) => handleChange(e.target.value, 'name')}
            ref={nameRef}
          />
        </form>
        <TypeEditor
          value={[entityData.type]}
          onChange={(v) => handleChange(v, 'type')}
          options={typeOptions}
        />
      </ContentStyled>
    </Dialog>
  )
}

NewEntity.propTypes = {
  type: PropTypes.string.isRequired,
  data: PropTypes.object,
  visible: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
}

export default NewEntity
