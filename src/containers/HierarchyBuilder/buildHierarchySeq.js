import { buildHierarchy } from './HierarchyBuilder'
import getSequence from './getSequence'
import { v1 as uuid1 } from 'uuid'
const replaceSpaces = (string) => {
  // replace spaces with underscores
  return string.replace(/\s/g, '_')
}

const generateUniqueId = () => uuid1().replace(/-/g, '')

const buildSeqs = (hierarchy = [], parentId, depth = 0, parentLabel) => {
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
        depth: depth,
        siblingsLength: 1,
      })
      return
    }

    item.seq.forEach((seqItem) => {
      console.log(parentLabel, seqItem, item.prefix)
      const name = item.prefix ? `${parentLabel}${seqItem}` : seqItem
      const newId = generateUniqueId()
      seqs.push({
        id: newId,
        label: name,
        name: replaceSpaces(name),
        parentId: parentId,
        entityType: 'folder',
        type: item.type,
        leaf: !item.children?.length,
        depth: depth,
        siblingsLength: item.seq.length,
      })

      if (item.children?.length) {
        const nestedSeqs = buildSeqs(item.children, newId, depth + 1, name)
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
    prefix: f.prefix,
  }))

  const hierarchy = buildHierarchy(template, null)

  const seqs = buildSeqs(hierarchy)

  return seqs
}

export default buildHierarchySeq
