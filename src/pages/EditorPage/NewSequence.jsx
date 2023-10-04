import React, { useRef } from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { Toolbar, Spacer, SaveButton, Button } from '@ynput/ayon-react-components'
import { Dialog } from 'primereact/dialog'
import FolderSequence from '/src/components/FolderSequence/FolderSequence'
import getSequence from '/src/helpers/getSequence'
import { isEmpty } from 'lodash'
import { toast } from 'react-toastify'

const NewSequence = ({
  visible,
  onConfirm,
  onHide,
  currentSelection = {},
  folderNames = new Map(),
}) => {
  const isRoot = isEmpty(currentSelection)
  const multipleSelection = Object.keys(currentSelection).length > 1
  const examplePrefix = isRoot
    ? ''
    : currentSelection[Object.keys(currentSelection)[0]]
    ? currentSelection[Object.keys(currentSelection)[0]].data.name
    : ''

  const [createSeq, setCreateSeq] = useState({})

  const openCreateSeq = () => {
    const newSeq = {
      base: 'Folder010',
      increment: 'Folder020',
      length: 10,
      type: 'Folder',
      prefix: multipleSelection,
      prefixDepth: !isRoot ? 1 : 0,
      entityType: 'folder',
    }

    setCreateSeq(newSeq)
  }

  useEffect(() => {
    openCreateSeq()
  }, [isRoot, currentSelection])

  //   refs
  const typeSelectRef = useRef(null)

  const handleShow = () => {
    const buttonEl = typeSelectRef.current.querySelector('button')
    // focus name dropdown
    buttonEl?.focus()
  }

  const title = 'Add Folder Sequence'

  const handleSeqChange = (value) => {
    const newValue = { ...createSeq, ...value }
    setCreateSeq(newValue)
  }

  const handleSeqSubmit = (hide = false) => {
    // get the sequence
    const seq = getSequence(createSeq.base, createSeq.increment, createSeq.length)
    // for each sequence item, create a new entity
    let nodes = []
    for (const item of seq) {
      nodes.push({
        folderType: createSeq.type,
        name: item,
        label: item.replace(/\s/g, '_'),
        __prefix: createSeq.prefix,
      })
    }

    // check if any of the names are already in use
    const names = nodes.map((n) => n.name)
    const duplicateNames = []
    for (const name of names) {
      if (folderNames.has(name)) {
        duplicateNames.push(name)
      }
    }

    if (duplicateNames.length > 0) {
      return toast.warning('Folder names must be unique: ' + duplicateNames.join(', '))
    }

    onConfirm('folder', isRoot, nodes, true)
    hide && onHide()

    // focus typeSelector again
    if (!hide) {
      handleShow()
    }
  }

  const handleKeyDown = (e) => {
    // ctrl + enter submit and close
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSeqSubmit(true)
    }
    // shift + enter submit and don't close
    if (e.shiftKey && e.key === 'Enter') {
      handleSeqSubmit(false)
    }
    // if tabbing from dropdown, focus name input
    if (e.key === 'Tab') {
      const target = e.target
      // check if target is inside typeSelectRef.current
      if (target && typeSelectRef.current.contains(target)) {
        e.stopPropagation()
      }
    }
  }

  const addDisabled =
    !createSeq.base || !createSeq.increment || !createSeq.length || !createSeq.type

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
            label="Add"
            disabled={addDisabled}
            onClick={() => handleSeqSubmit(false)}
            title={'Shift + Enter'}
          />
          <SaveButton
            label={'Add and Close'}
            onClick={() => handleSeqSubmit(true)}
            active={!addDisabled}
            title="Ctrl/Cmd + Enter"
          />
        </Toolbar>
      }
      onKeyDown={handleKeyDown}
    >
      <FolderSequence
        {...createSeq}
        nesting={false}
        onChange={handleSeqChange}
        isRoot={isRoot}
        prefixExample={createSeq.prefix ? examplePrefix : ''}
        prefixDisabled={multipleSelection}
        typeSelectRef={typeSelectRef}
      />
    </Dialog>
  )
}

export default NewSequence
