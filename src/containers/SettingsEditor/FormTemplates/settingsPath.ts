import { $Any } from '@types'

/** Whether `path` lies inside `parentPath` (or is it): every part of the parent starts it */
export const isInsidePath = (path: $Any[] | undefined, parentPath: $Any[] | undefined) => {
  const parent = parentPath || []
  const child = path || []
  if (parent.length > child.length) return false
  return parent.every((part, i) => child[i] === part)
}
