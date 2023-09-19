import { buildHierarchy } from './HierarchyBuilder'
import getSequence from './getSequence'
import { v1 as uuid1 } from 'uuid'
const replaceSpaces = (string) => {
  // replace spaces with underscores
  return string.replace(/\s/g, '_')
}

const generateUniqueId = () => uuid1().replace(/-/g, '')

const buildSeqs = (hierarchy = [], parentId) => {
  let seqs = []

  hierarchy.forEach((item) => {
    if (item.entityType === 'task') {
      seqs.push({
        id: generateUniqueId(),
        label: item.label,
        name: replaceSpaces(item.label),
        parentId: parentId,
        entityType: 'task',
        type: item.type,
        leaf: true,
      })
      return
    }

    item.seq.forEach((seqItem) => {
      const newId = generateUniqueId()
      seqs.push({
        id: newId,
        label: seqItem,
        name: replaceSpaces(seqItem),
        parentId: parentId,
        entityType: 'folder',
        type: item.type,
        leaf: !item.children?.length,
      })

      if (item.children?.length) {
        const nestedSeqs = buildSeqs(item.children, newId)
        seqs = [...seqs, ...nestedSeqs]
      }
    })
  })

  return seqs
}

const buildHierarchySeq = (items) => {
  // split out folders and tasks
  const template = items.map((f) => ({
    label: f.base,
    id: f.id,
    parent: f.parent,
    entityType: f.entityType,
    type: f.type,
    name: replaceSpaces(f.base),
    seq: f.entityType === 'task' ? [] : getSequence(f.base, f.increment, f.length),
  }))

  const hierarchy = buildHierarchy(template, null)

  const seqs = buildSeqs(hierarchy)

  return seqs
}

export default buildHierarchySeq
