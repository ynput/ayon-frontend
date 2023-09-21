import React from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { Button, Toolbar, Spacer } from '@ynput/ayon-react-components'

import { useSelector } from 'react-redux'
import { Dialog } from 'primereact/dialog'
import FolderSequence from '/src/components/FolderSequence/FolderSequence'
import getSequence from '/src/helpers/getSequence'

const NewSequence = ({ visible, onConfirm, onHide }) => {
  const focusedFolders = useSelector((state) => state.context.focused.folders)

  const [createSeq, setCreateSeq] = useState({})

  const openCreateSeq = () => {
    const newSeq = {
      base: '',
      increment: '',
      length: 10,
      type: 'Folder',
      prefix: !!focusedFolders.length,
      prefixDepth: focusedFolders.length ? 1 : 0,
    }

    setCreateSeq(newSeq)
  }

  useEffect(() => {
    openCreateSeq()
  }, [focusedFolders])

  const title = 'Create Folder Sequence'

  const handleSeqChange = (value) => {
    const newValue = { ...createSeq, ...value }
    setCreateSeq(newValue)
  }

  const handleSeqSubmit = () => {
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

    const isRoot = !focusedFolders.length

    onConfirm('folder', isRoot, nodes, false)
    onHide()
  }

  return (
    <Dialog
      header={title}
      visible={visible}
      onHide={onHide}
      resizable={false}
      draggable={false}
      footer={
        <Toolbar>
          <Spacer />
          <Button label={'Create'} onClick={handleSeqSubmit} variant="filled" />
        </Toolbar>
      }
    >
      <FolderSequence
        {...createSeq}
        nesting={false}
        onChange={handleSeqChange}
        selectedParents={focusedFolders}
      />
    </Dialog>
  )
}

export default NewSequence
