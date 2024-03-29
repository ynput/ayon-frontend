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
    // open dropdown
    typeSelectRef.current?.open()
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

  const handleKeyDown = (e, lastInput) => {
    if (e.key === 'Enter') {
      if (lastInput && !e.shiftKey) {
        handleSeqSubmit(true)
      } else if (e.ctrlKey || e.metaKey) {
        handleSeqSubmit(true)
      } else if (e.shiftKey) {
        handleSeqSubmit(false)
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
      appendTo={document.getElementById('root')}
      footer={
        <Toolbar>
          <Spacer />
          <Button
            label="Add"
            disabled={addDisabled}
            onClick={() => handleSeqSubmit(false)}
            data-shortcut="Shift+Enter"
          />
          <SaveButton
            label={'Add and Close'}
            onClick={() => handleSeqSubmit(true)}
            active={!addDisabled}
            data-shortcut="Ctrl/Cmd+Enter"
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
        onLastInputKeydown={(e) => handleKeyDown(e, true)}
      />
    </Dialog>
  )
}

export default NewSequence
