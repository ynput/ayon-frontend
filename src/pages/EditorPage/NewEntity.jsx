import React from 'react'
import PropTypes from 'prop-types'
import { capitalize, isEmpty } from 'lodash'
import { useState } from 'react'
import { useEffect } from 'react'
import {
  Button,
  InputText,
  SaveButton,
  Spacer,
  Toolbar,
  Dialog,
} from '@ynput/ayon-react-components'
import { useRef } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import TypeEditor from './TypeEditor'
import checkName from '@helpers/checkName'

const ContentStyled = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  form {
    input:first-child {
      margin-right: 8px;
    }
  }
`

const NewEntity = ({ type, currentSelection = {}, visible, onConfirm, onHide }) => {
  const [nameFocused, setNameFocused] = useState(false)
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
  const tasksOrder = useSelector((state) => state.project.tasksOrder)
  const folders = useSelector((state) => state.project.folders)
  const foldersOrder = useSelector((state) => state.project.foldersOrder)
  const typeOptions = type === 'folder' ? folders : tasks

  // set entity type
  useEffect(() => {
    if (type !== entityType && type) {
      setEntityType(type)
      let task = {}
      const firstTask = tasksOrder[0]

      if (firstTask in tasks) {
        task = {
          name: tasks[firstTask].name,
          label: tasks[firstTask].name,
          type: firstTask,
        }
      }

      let folder = {}
      const firstFolder = foldersOrder[0]
      if (firstFolder in folders) {
        folder = {
          name: folders[firstFolder].name,
          label: folders[firstFolder].name,
          type: firstFolder,
        }
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
          type === 'folder'
            ? typeOption.shortName || typeOption.name.toLowerCase()
            : typeOption.name.toLowerCase()
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
      }, 100)
    }
  }

  //   refs
  const typeSelectRef = useRef(null)
  const labelRef = useRef(null)

  // open dropdown - delay to wait for dialog opening
  const handleShow = () => setTimeout(() => typeSelectRef.current?.open(), 180)

  const handleSubmit = (hide = false) => {
    // first check name and type valid
    if (!entityData.label || !entityData.type) return

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

  const handleKeyDown = (e, lastInput) => {
    e?.stopPropagation()
    if (e.key === 'Enter') {
      if (lastInput && !e.shiftKey) {
        handleSubmit(true)
      } else if (e.ctrlKey || e.metaKey) {
        handleSubmit(true)
      } else if (e.shiftKey) {
        handleSubmit(false)
      }
    } else if (e.key === 'Escape') {
      onHide()
    }
  }

  const handleTypeSelectFocus = () => {
    if (nameFocused) {
      setNameFocused(false)
      // super hacky way to fix clicking on type select when name is focused
      setTimeout(() => {
        typeSelectRef.current?.open()
      }, 100)
    }
  }

  if (!entityType) return null

  const addDisabled = !entityData.label || !entityData.type

  return (
    <Dialog
      header={title}
      isOpen={visible}
      onClose={onHide}
      onShow={handleShow}
      size="sm"
      variant="dialog"
      style={{ zIndex: 999 }}
      footer={
        <Toolbar onFocus={() => setNameFocused(false)}>
          <Spacer />
          <Button
            label={`Add`}
            variant="text"
            onClick={() => handleSubmit(false)}
            disabled={addDisabled}
            data-shortcut="Shift+Enter"
          />
          <SaveButton
            label={`Add and Close`}
            onClick={() => handleSubmit(true)}
            active={!addDisabled}
            title="Ctrl/Cmd + Enter"
            data-shortcut="Ctrl/Cmd+Enter"
          />
        </Toolbar>
      }
      onKeyDown={handleKeyDown}
      onClick={(e) => e.target.tagName !== 'INPUT' && setNameFocused(false)}
    >
      <ContentStyled>
        <TypeEditor
          value={[entityData.type]}
          onChange={(v) => handleChange(v, 'type')}
          options={typeOptions}
          style={{ width: 160 }}
          ref={typeSelectRef}
          onFocus={handleTypeSelectFocus}
          onClick={() => setNameFocused(false)}
          type={entityType}
        />
        <InputText
          value={entityData.label}
          onChange={(e) => handleChange(e.target.value, 'label')}
          ref={labelRef}
          onFocus={() => setNameFocused(true)}
          onKeyDown={(e) => handleKeyDown(e, true)}
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
