import { Dialog } from 'primereact/dialog'
import React, { useEffect, useMemo, useState } from 'react'
import { v1 as uuid1 } from 'uuid'
import FolderHierarchy from '/src/components/FolderSequence/FolderHierarchy'
import { Button, SaveButton, Spacer, Toolbar } from '@ynput/ayon-react-components'
import buildHierarchySeq from './buildHierarchySeq'
import HierarchyPreviewWrapper from '/src/components/HierarchyPreview/HierarchyPreviewWrapper'
import { useDispatch } from 'react-redux'
import { newNodesAdded } from '/src/features/editor'

function findMaxChildDepth(hierarchyForm, itemId) {
  let maxChildDepth = 0
  for (const item of hierarchyForm) {
    if (item.parentId === itemId) {
      const childDepth = findMaxChildDepth(hierarchyForm, item.id)
      maxChildDepth = Math.max(maxChildDepth, childDepth + 1)
    }
  }
  return maxChildDepth
}

export function buildHierarchy(hierarchyForm, parentId = null, depth = 0, parentBases = []) {
  const hierarchy = []
  for (const item of hierarchyForm) {
    if (item.parentId === parentId) {
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

const buildPreviewHierarchy = (flatHierarchy = [], parentId = null) => {
  const hierarchy = []
  for (const item of flatHierarchy) {
    if (item.parentId === parentId) {
      const children = buildPreviewHierarchy(flatHierarchy, item.id)
      hierarchy.push({ ...item, children })
    }
  }
  return hierarchy
}

const checkAllNamesUnique = (items) => {
  const names = {}
  for (let i = 0; i < items.length; i++) {
    if (names[items[i].name]) {
      return false
    }
    names[items[i].name] = true
  }
  return true
}

// deletes parentId and all children
const deleteItem = (id, hierarchyForm) => {
  let newForm = hierarchyForm.filter((item) => item.id !== id)

  const childItems = hierarchyForm.filter((item) => item.parentId === id)

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
const HierarchyBuilder = ({ visible, onHide, parents = [], onSubmit, attrib }) => {
  const dispatch = useDispatch()

  const initForm = [
    {
      id: generateId(),
      base: '',
      increment: '',
      length: 2,
      type: '',
      entityType: 'folder',
      parentId: null,
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

  // eslint-disable-next-line no-unused-vars
  const [tooBig, setTooBig] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // if (tooBig) return
    const flatHierarchy = buildHierarchySeq(hierarchyForm)

    const allNamesUnique = checkAllNamesUnique(flatHierarchy)

    if (!allNamesUnique) {
      setError('Names must be unique')
    } else {
      setError(null)
    }

    if (flatHierarchy.length > 8000) {
      setTooBig(flatHierarchy.length)
      setPreview([])
      return
    }

    // build a hierarchy from the flat hierarchy
    const hierarchy = buildPreviewHierarchy(flatHierarchy)
    setPreview(hierarchy)
  }, [hierarchyForm, tooBig])

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
            length: 2,
            type: parent.type || '',
            prefix: parent.prefix + 1 || 1,
          }
    // create a new item with parentId
    const newItem = {
      id: generateId(),
      parentId: parentId,
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
    const newEntities = buildHierarchySeq(
      hierarchyForm,
      parents.map((p) => p.id),
    )

    let newNodes = []
    for (const item of newEntities) {
      const newNode = {
        leaf: item.leaf,
        name: item.name,
        label: item.label,
        id: item.id,
        status: 'Not ready',
        attrib: attrib,
        ownAttrib: [],
        __entityType: item.entityType,
        __parentId: item.parentId || 'root',
        __isNew: true,
        __depth: item.depth,
        [item.entityType === 'folder' ? 'parentId' : 'folderId']: item.parentId,
        [item.entityType === 'folder' ? 'folderType' : 'taskType']: item.type,
      }

      newNodes.push(newNode)
    }

    dispatch(newNodesAdded(newNodes))

    onHide()
    onSubmit(newNodes)
  }

  let parentsLabels = parents?.map((p) => p?.label).join(', ')
  if (parentsLabels.length > 50) {
    parentsLabels = parentsLabels.slice(0, 50) + '...'
  }

  return (
    <Dialog
      header={`Hierarchy Builder Inside: ${parents.length ? parentsLabels : 'root'}`}
      visible={visible}
      onHide={onHide}
      style={{ minWidth: '95vw', maxWidth: '95vw', minHeight: '90vh' }}
      contentStyle={{ gap: 16, display: 'flex', flexDirection: 'column' }}
      footer={
        <Toolbar>
          <Spacer />
          <Button onClick={onHide} variant={'text'}>
            Close
          </Button>
          <SaveButton onClick={handleSubmit} active={allFieldsValid && !error}>
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
      <h2 style={{ marginBottom: 0 }}>
        {tooBig ? 'Preview disabled due to hierarchy size: ' + tooBig : 'Preview'}
      </h2>
      {!tooBig && <HierarchyPreviewWrapper hierarchy={preview} error={error} />}
    </Dialog>
  )
}

export default HierarchyBuilder
