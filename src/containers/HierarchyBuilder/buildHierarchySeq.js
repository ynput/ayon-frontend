import { buildHierarchy } from './HierarchyBuilder'
import getSequence from './getSequence'
import { v1 as uuid1 } from 'uuid'
const replaceSpaces = (string) => {
  // replace spaces with underscores
  return string.replace(/\s/g, '_')
}

const generateUniqueId = () => uuid1().replace(/-/g, '')

const buildSeqs = (hierarchy = []) => {
  const stack = [{ hierarchy, parentId: null, depth: 0, parentNames: [] }]
  const seqs = []

  while (stack.length) {
    const { hierarchy, parentId, depth, parentNames } = stack.pop()

    hierarchy.forEach((item) => {
      if (item.entityType === 'task') {
        seqs.push({
          id: generateUniqueId(),
          label: item.label,
          name: replaceSpaces(item.label),
          parentId,
          entityType: 'task',
          type: item.type,
          leaf: true,
          depth,
          siblingsLength: 1,
        })
        return
      }

      item.seq.forEach((seqItem) => {
        // keep onl the prefix number of parents
        const prefixParents = parentNames.slice(0, item.prefix)
        const name = item.prefix ? `${prefixParents.join('')}${seqItem}` : seqItem
        const newId = generateUniqueId()
        seqs.push({
          id: newId,
          label: name,
          name: replaceSpaces(name),
          parentId,
          entityType: 'folder',
          type: item.type,
          leaf: !item.children?.length,
          depth,
          siblingsLength: item.seq.length,
        })

        if (item.children?.length) {
          stack.push({
            hierarchy: item.children,
            parentId: newId,
            depth: depth + 1,
            parentNames: [...parentNames, seqItem],
          })
        }
      })
    })
  }

  return seqs
}

const buildHierarchySeq = (items, rootParents) => {
  // split out folders and tasks
  const template = items.map((f) => ({
    label: f.base,
    id: f.id,
    parentId: f.parentId,
    entityType: f.entityType,
    type: f.type,
    name: replaceSpaces(f.base),
    seq: f.entityType === 'task' ? [] : getSequence(f.base, f.increment, f.length),
    prefix: f.prefix,
  }))

  const hierarchy = buildHierarchy(template, null)

  let allSeqs = []
  if (rootParents?.length) {
    rootParents.forEach((id) => {
      const seqs = buildSeqs(hierarchy, id)

      allSeqs = [...allSeqs, ...seqs]
    })
  } else {
    allSeqs = buildSeqs(hierarchy)
  }

  console.log(allSeqs.length)

  return allSeqs
}

export default buildHierarchySeq
