import React, { useRef } from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { Toolbar, Spacer, SaveButton, Button, Dialog } from '@ynput/ayon-react-components'
import FolderSequence from '@components/FolderSequence/FolderSequence'
import getSequence from '@helpers/getSequence'
import { isEmpty } from 'lodash'
import { useSelector } from 'react-redux'

const NewSequence = ({ visible, onConfirm, onHide, currentSelection = {} }) => {
  const foldersOrder = useSelector((state) => state.project.foldersOrder)

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
      type: foldersOrder[0],
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

  // open dropdown - delay to wait for dialog opening
  const handleShow = () => setTimeout(() => typeSelectRef.current?.open(), 180)

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

    onConfirm('folder', isRoot, nodes, true)
    hide && onHide()

    // focus typeSelector again
    if (!hide) {
      handleShow()
    }
  }

  const handleKeyDown = (e, lastInput) => {
    if (e.key === 'Escape') onHide()
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
      isOpen={visible}
      onClose={onHide}
      onShow={handleShow}
      size="lg"
      style={{ zIndex: 999 }}
      footer={
        <Toolbar onFocus={false}>
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
    >
      <FolderSequence
        {...createSeq}
        nesting={false}
        onChange={handleSeqChange}
        isRoot={isRoot}
        prefixExample={createSeq.prefix ? examplePrefix : ''}
        typeSelectRef={typeSelectRef}
        onLastInputKeydown={(e) => handleKeyDown(e, true)}
      />
    </Dialog>
  )
}

export default NewSequence
