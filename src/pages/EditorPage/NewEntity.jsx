import React from 'react'
import PropTypes from 'prop-types'
import { capitalize } from 'lodash'
import { useState } from 'react'
import { useEffect } from 'react'
import { InputText, Button, Toolbar, Spacer } from '@ynput/ayon-react-components'
import { useRef } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import TypeEditor from './TypeEditor'
import checkName from '/src/helpers/checkName'
import { Dialog } from 'primereact/dialog'
import FolderSequence from '/src/components/FolderSequence/FolderSequence'
import getSequence from '/src/containers/HierarchyBuilder/getSequence'

const ContentStyled = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  form {
    input:first-child {
      margin-right: 8px;
    }
  }
`

const NewEntity = ({ type, data = {}, visible, onConfirm, onHide }) => {
  const [entityType, setEntityType] = useState(null)
  //   build out form state
  const initData = { label: '', name: '', type: '' }
  const [entityData, setEntityData] = useState(initData)

  const [createSeq, setCreateSeq] = useState(null)

  const openCreateSeq = () => {
    let base = entityData.label
    let increment = entityData.label
    // Extract the numeric parts from the 'start' and 'next' strings
    const startNumber = parseInt((base.match(/\d+$/) || [])[0], 10)
    if (startNumber) {
      const baseWithoutNumber = base.replace(/\d+$/, '')
      // add ten to the number for the increment
      increment = baseWithoutNumber + (startNumber + 10)
    } else {
      base = entityData.label + '010'
      // no number in the base, just add 10
      increment = entityData.label + '020'
    }

    const newSeq = {
      base,
      increment,
      length: 10,
      type: entityData.label,
    }

    setCreateSeq(newSeq)
  }

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
  const labelRef = useRef(null)

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
    let newState = { ...entityData }
    if (id) {
      newState[id] = value
      if (value && id === 'type' && entityData.name === entityData.type.toLowerCase()) {
        // if name is same as type, update name
        newState.name = value.toLowerCase()
        newState.label = value
      }
    }

    if (id === 'label') {
      newState.name = checkName(value)
    }
    setEntityData(newState)
  }

  const handleSeqChange = (value) => {
    const newValue = { ...createSeq, ...value }
    setCreateSeq(newValue)
  }

  const handleShow = () => {
    // focus name input
    labelRef.current?.focus()
    // select name
    labelRef.current?.select()
  }

  const finalSubmit = (data) => {
    // clear states
    setEntityType(null)
    setEntityData(initData)

    // callbacks
    onConfirm(entityType, isRoot, data)
    onHide()
  }

  const handleSeqSubmit = () => {
    // get the sequence
    const seq = getSequence(createSeq.base, createSeq.increment, createSeq.length)
    // for each sequence item, create a new entity
    seq.forEach((item) => {
      const newEntity = {
        ...entityData,
        folderType: createSeq.type,
        name: item,
        label: item.replace(/\s/g, '_'),
      }

      finalSubmit(newEntity)
    })
  }

  const handleSubmit = (e) => {
    console.log('subbing')
    e?.preventDefault()

    // convert type to correct key
    // convert name to camelCase
    const newData = {
      ...entityData,
      [`${type}Type`]: entityData.type,
      name: entityData.name,
      label: entityData.label,
    }

    finalSubmit(newData)
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
        <Toolbar>
          <Spacer />
          {entityType === 'folder' && !createSeq ? (
            <Button label="Create multiple" variant="text" onClick={openCreateSeq} />
          ) : (
            <Button label="Create single" variant="text" onClick={() => setCreateSeq(null)} />
          )}
          <Button
            label={'Create'}
            onClick={createSeq ? handleSeqSubmit : handleSubmit}
            variant="filled"
          />
        </Toolbar>
      }
    >
      {createSeq ? (
        <FolderSequence {...createSeq} nesting={false} onChange={handleSeqChange} />
      ) : (
        <ContentStyled>
          <form onSubmit={handleSubmit}>
            <InputText
              value={entityData.label}
              onChange={(e) => handleChange(e.target.value, 'label')}
              ref={labelRef}
            />
          </form>
          <TypeEditor
            value={[entityData.type]}
            onChange={(v) => handleChange(v, 'type')}
            options={typeOptions}
            style={{ width: 160 }}
          />
        </ContentStyled>
      )}
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
