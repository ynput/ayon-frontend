import { Dialog } from 'primereact/dialog'
import React, { useMemo, useState } from 'react'
import { v1 as uuid1 } from 'uuid'
import FolderHierarchy from '/src/components/FolderSequence/FolderHierarchy'
import { Button, SaveButton, Spacer, Toolbar } from '@ynput/ayon-react-components'
import buildHierarchySeq from './buildHierarchySeq'

function findMaxChildDepth(hierarchyForm, itemId) {
  let maxChildDepth = 0
  for (const item of hierarchyForm) {
    if (item.parent === itemId) {
      const childDepth = findMaxChildDepth(hierarchyForm, item.id)
      maxChildDepth = Math.max(maxChildDepth, childDepth + 1)
    }
  }
  return maxChildDepth
}

export function buildHierarchy(hierarchyForm, parentId = null, depth = 0) {
  const hierarchy = []
  for (const item of hierarchyForm) {
    if (item.parent === parentId) {
      const newDepth = depth + 1
      const children = buildHierarchy(hierarchyForm, item.id, newDepth)
      const maxChildDepth = findMaxChildDepth(hierarchyForm, item.id)
      hierarchy.push({
        ...item,
        children,
        maxChildDepth,
        depth: depth,
      })
    }
  }
  return hierarchy
}

const generateId = () => uuid1().replace(/-/g, '')
//
//
//
//
//
// COMPONENT
const HierarchyBuilder = ({ visible, onHide, parents = [], onSubmit }) => {
  //   fake data
  const parent1 = generateId()
  // const parent2 = generateId()

  const initForm = [
    {
      id: parent1,
      base: 'ep010',
      increment: 'ep020',
      length: 10,
      type: 'Episode',
      entityType: 'folder',
      parent: null,
    },
    // {
    //   id: parent2,
    //   parent: parent1,
    //   base: 'sc0100',
    //   increment: 'sc0200',
    //   length: 4,
    //   type: 'Scene',
    //   entityType: 'folder',
    // },
    // {
    //   id: generateId(),
    //   parent: parent2,
    //   base: 'Compositing',
    //   type: 'Compositing',
    //   entityType: 'task',
    // },
  ]

  const [hierarchyForm, setHierarchyForm] = useState(initForm)

  const allFieldsValid = hierarchyForm.every(
    (item) =>
      (item.base && item.increment && item.length && item.type) || item.entityType === 'task',
  )

  const hierarchy = useMemo(() => buildHierarchy(hierarchyForm), [hierarchyForm])

  const maxDepth = hierarchy.reduce((max, item) => Math.max(max, item.maxChildDepth), 0)

  const handleChange = (value, id) => {
    // find the item in the form
    const item = hierarchyForm.find((i) => i.id === id)
    if (value.delete) {
      // remove the item from the form
      const newForm = hierarchyForm.filter((i) => i.id !== value.id)
      // don't allow deleting the last item
      if (newForm.length === 0) return
      // update state
      setHierarchyForm(newForm)
    } else {
      // update the item
      const newItem = { ...item, ...value }

      // update the form
      const newForm = hierarchyForm.map((i) => (i.id === newItem.id ? newItem : i))
      // update state
      setHierarchyForm(newForm)
    }
  }

  const handleNew = (parentId, type) => {
    // get parent
    const parent = hierarchyForm.find((i) => i.id === parentId) || {}
    const init =
      type === 'task'
        ? {
            type: 'Generic',
            base: 'Generic',
          }
        : {
            base: parent.base || '',
            increment: parent.increment || '',
            length: parent.length || '',
            type: parent.type || '',
          }
    // create a new item with parentId
    const newItem = {
      id: generateId(),
      parent: parentId,
      base: '',
      increment: '',
      length: '',
      type: '',
      entityType: type,
      ...init,
    }

    // update the form
    const newForm = [...hierarchyForm, newItem]
    // update state
    setHierarchyForm(newForm)
  }

  const handleSubmit = () => {
    const newEntities = buildHierarchySeq(hierarchyForm, parents)
    onSubmit(newEntities)
  }

  const parentsLabels = parents?.map((p) => p?.label).join(', ')

  return (
    <Dialog
      header={`Hierarchy Builder Inside: ${parents.length ? parentsLabels : 'root'}`}
      visible={visible}
      onHide={onHide}
      style={{ maxWidth: '95vw' }}
      contentStyle={{ gap: 16, display: 'flex', flexDirection: 'column' }}
      footer={
        <Toolbar>
          <Spacer />
          <Button onClick={onHide} variant={'text'}>
            Close
          </Button>
          <SaveButton onClick={handleSubmit} active={allFieldsValid}>
            Create hierarchy
          </SaveButton>
        </Toolbar>
      }
    >
      <FolderHierarchy
        hierarchy={hierarchy}
        onChange={handleChange}
        onNew={handleNew}
        maxDepth={maxDepth}
      />
    </Dialog>
  )
}

export default HierarchyBuilder
