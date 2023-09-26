import React, { useRef } from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { Toolbar, Spacer, SaveButton, Button } from '@ynput/ayon-react-components'
import { Dialog } from 'primereact/dialog'
import FolderSequence from '/src/components/FolderSequence/FolderSequence'
import getSequence from '/src/helpers/getSequence'
import { isEmpty } from 'lodash'

const NewSequence = ({ visible, onConfirm, onHide, currentSelection = {} }) => {
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
      base: '',
      increment: '',
      length: 10,
      type: 'Folder',
      prefix: multipleSelection,
      prefixDepth: !isRoot ? 1 : 0,
    }

    setCreateSeq(newSeq)
  }

  useEffect(() => {
    openCreateSeq()
  }, [isRoot])

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

    onConfirm('folder', isRoot, nodes, false)
    hide && onHide()
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
