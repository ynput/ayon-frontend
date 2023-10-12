import React from 'react'
import PropTypes from 'prop-types'
import { capitalize, isEmpty } from 'lodash'
import { useState } from 'react'
import { useEffect } from 'react'
import { Button, InputText, SaveButton, Spacer, Toolbar } from '@ynput/ayon-react-components'
import { useRef } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import TypeEditor from './TypeEditor'
import checkName from '/src/helpers/checkName'
import { Dialog } from 'primereact/dialog'
import { toast } from 'react-toastify'

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

const NewEntity = ({
  type,
  currentSelection = {},
  visible,
  onConfirm,
  onHide,
  folderNames = new Map(),
  taskNames = new Map(),
}) => {
  const [entityType, setEntityType] = useState(null)
  //   build out form state
  const initData = { label: '', name: '', type: '' }
  const [entityData, setEntityData] = useState(initData)

  //   format title
  const isRoot = isEmpty(currentSelection)
  let title = 'Add New '
  if (isRoot) title += 'Root '
  title += capitalize(type)

  //   type selector
  const tasks = useSelector((state) => state.project.tasks)
  const folders = useSelector((state) => state.project.folders)
  const typeOptions = type === 'folder' ? folders : tasks

  // set entity type
  useEffect(() => {
    if (type !== entityType && type) {
      setEntityType(type)
      const task = {
        label: 'Generic',
        name: 'generic',
        type: 'Generic',
      }

      const folder = {
        label: 'Folder',
        name: 'folder',
        type: 'Folder',
      }

      // set defaults
      if (type === 'task') setEntityData(task)
      if (type === 'folder') setEntityData(folder)
    }
  }, [type, visible])

  // handlers

  const handleChange = (value, id) => {
    let newState = { ...entityData }
    if (id) {
      newState[id] = value
      if (value && id === 'type') {
        // changing type
        // update name if newState.name matches any values in typeOptions
        let matches = false
        // loop through typeOptions and check if any match, when match is found we can stop looping
        for (const o in typeOptions) {
          if (newState.name === '') {
            matches = true
            break
          }
          const option = typeOptions[o]
          for (const key in option) {
            if (newState.name.toLowerCase().includes(option[key].toLowerCase())) {
              matches = true
              break
            }
          }
        }

        const typeOption = typeOptions[value]

        if (!matches || !typeOption) return
        // if name is same as type, update name
        const newName =
          type === 'folder' ? typeOption.shortName || typeOption.name : typeOption.name
        newState.name = newName
        newState.label = newName
      }
    }

    if (id === 'label') {
      newState.name = checkName(value)
    }
    setEntityData(newState)

    if (id === 'type') {
      setTimeout(() => {
        labelRef.current.focus()
      }, 50)
    }
  }

  //   refs
  const typeSelectRef = useRef(null)
  const labelRef = useRef(null)

  const handleShow = () => {
    // open dropdown
    typeSelectRef.current?.open()
  }

  const handleSubmit = (hide = false) => {
    // first check name and type valid
    if (!entityData.label || !entityData.type) return

    // check name is unique
    if (folderNames.has(entityData.name) && type === 'folder')
      return toast.warning('Folder names must be unique')
    else if (taskNames.get(entityData.name) in currentSelection) {
      return toast.warning('Sibling Task names must be unique')
    }

    // convert type to correct key
    // convert name to camelCase
    const newData = {
      ...entityData,
      [`${type}Type`]: entityData.type,
      name: entityData.name,
      label: entityData.label,
    }

    // callbacks
    onConfirm(entityType, isRoot, [newData])
    hide && onHide()

    if (!hide) {
      // focus and select the label input
      labelRef.current.focus()
      labelRef.current.select()
    }
  }

  const handleKeyDown = (e) => {
    // ctrl + enter submit and close
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(true)
    }
    // shift + enter submit and don't close
    if (e.shiftKey && e.key === 'Enter') {
      handleSubmit(false)
    }
  }

  if (!entityType) return null

  const addDisabled = !entityData.label || !entityData.type

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
          <Button
            label={`Add`}
            variant="text"
            onClick={() => handleSubmit(false)}
            disabled={addDisabled}
            title={'Shift + Enter'}
          />
          <SaveButton
            label={`Add and Close`}
            onClick={() => handleSubmit(true)}
            active={!addDisabled}
            title="Ctrl/Cmd + Enter"
          />
        </Toolbar>
      }
      onKeyDown={handleKeyDown}
    >
      <ContentStyled>
        <TypeEditor
          value={[entityData.type]}
          onChange={(v) => handleChange(v, 'type')}
          options={typeOptions}
          style={{ width: 160 }}
          ref={typeSelectRef}
        />
        <InputText
          value={entityData.label}
          onChange={(e) => handleChange(e.target.value, 'label')}
          ref={labelRef}
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
