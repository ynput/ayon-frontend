import { Dialog } from 'primereact/dialog'
import React, { useEffect, useMemo, useState } from 'react'
import { v1 as uuid1 } from 'uuid'
import FolderHierarchy from '/src/components/FolderSequence/FolderHierarchy'
import { Button, SaveButton, Spacer, Toolbar } from '@ynput/ayon-react-components'
import buildHierarchySeq from './buildHierarchySeq'
import HierarchyPreviewWrapper from '/src/components/HierarchyPreview/HierarchyPreviewWrapper'

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

export function buildHierarchy(hierarchyForm, parentId = null, depth = 0, parentBases = []) {
  const hierarchy = []
  for (const item of hierarchyForm) {
    if (item.parent === parentId) {
      const newDepth = depth + 1
      const children = buildHierarchy(hierarchyForm, item.id, newDepth, [...parentBases, item.base])
      const maxChildDepth = findMaxChildDepth(hierarchyForm, item.id)
      hierarchy.push({
        ...item,
        children,
        maxChildDepth,
        depth: depth,
        parentBases,
      })
    }
  }
  return hierarchy
}

const buildPreviewHierarchy = (flatHierarchy = [], parentId = undefined) => {
  const hierarchy = []
  for (const item of flatHierarchy) {
    if (item.parentId === parentId) {
      const children = buildPreviewHierarchy(flatHierarchy, item.id)
      hierarchy.push({ ...item, children })
    }
  }
  return hierarchy
}

// deletes parent and all children
const deleteItem = (id, hierarchyForm) => {
  let newForm = hierarchyForm.filter((item) => item.id !== id)

  const childItems = hierarchyForm.filter((item) => item.parent === id)

  childItems.forEach((child) => {
    newForm = deleteItem(child.id, newForm)
  })

  return newForm
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
  const parent2 = generateId()
  const parent3 = generateId()

  const initForm = [
    {
      id: parent1,
      base: 'ep010',
      increment: 'ep020',
      length: 2,
      type: 'Episode',
      entityType: 'folder',
      parent: null,
    },
    {
      id: parent2,
      parent: parent1,
      base: 'sc0100',
      increment: 'sc0200',
      length: 2,
      type: 'Sequence',
      entityType: 'folder',
      prefix: 1,
    },
    {
      id: parent3,
      parent: parent2,
      base: 'sh0010',
      increment: 'sh0020',
      entityType: 'folder',
      length: 2,
      type: 'Shot',
      prefix: 2,
    },
    {
      id: generateId(),
      entityType: 'task',
      type: 'Compositing',
      base: 'Compositing',
      parent: parent3,
    },
    {
      id: generateId(),
      entityType: 'task',
      type: 'Compositing',
      base: 'Compositing',
      parent: parent3,
    },
    {
      id: generateId(),
      entityType: 'task',
      type: 'Compositing',
      base: 'Compositing',
      parent: parent3,
    },
    {
      id: generateId(),
      entityType: 'task',
      type: 'Compositing',
      base: 'Compositing',
      parent: parent3,
    },
  ]

  const [hierarchyForm, setHierarchyForm] = useState(initForm)
  const [preview, setPreview] = useState([])

  const allFieldsValid = hierarchyForm.every(
    (item) =>
      (item.base && item.increment && item.length && item.type) || item.entityType === 'task',
  )

  const hierarchy = useMemo(() => buildHierarchy(hierarchyForm), [hierarchyForm])

  const maxDepth = hierarchy.reduce((max, item) => Math.max(max, item.maxChildDepth), 0)

  const handleChange = (value, id) => {
    // value is the value of the new field
    // find the item in the form
    const item = hierarchyForm.find((i) => i.id === id)
    if (value.delete) {
      const newForm = deleteItem(value.id, hierarchyForm)
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

  useEffect(() => {
    const flatHierarchy = buildHierarchySeq(hierarchyForm, parents)
    // build a hierarchy from the flat hierarchy
    const hierarchy = buildPreviewHierarchy(flatHierarchy)
    setPreview(hierarchy)
  }, [hierarchyForm])

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
            base: '',
            increment: parent.increment || '',
            length: parent.length || '',
            type: parent.type || '',
            prefix: parent.prefix + 1 || 1,
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
      style={{ maxWidth: '95vw', minHeight: '90vh' }}
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
      <div style={{ height: 'min-content', flex: 1 }}>
        <FolderHierarchy
          hierarchy={hierarchy}
          onChange={handleChange}
          onNew={handleNew}
          maxDepth={maxDepth}
        />
      </div>
      <h2 style={{ marginBottom: 0 }}>Preview</h2>
      <HierarchyPreviewWrapper hierarchy={preview} />
    </Dialog>
  )
}

export default HierarchyBuilder
