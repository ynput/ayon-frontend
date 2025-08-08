// how many levels until we hit the first parent folder
const pathDepths = {
  folder: 1,
  task: 1,
  product: 1,
  version: 2,
  representation: 3,
  workfile: 2,
}

// return only the end of the path based on the path depth
// if there are any remaining segments at the start, use .. instead
// example for version: 'folder1/folder2/product' -> '../folder2/product
export const formatEntityPath = (path: string = '', entityType: string): string[] => {
  let segments = path.split('/')

  const depth = pathDepths[entityType as keyof typeof pathDepths] || 0

  if (segments.length <= depth) {
    // Return the path as a list of strings, separated by '/'
    const result = segments.reduce<string[]>((acc, seg, idx) => {
      if (idx > 0) acc.push('/')
      acc.push(seg)
      return acc
    }, [])
    if (result.length > 0) result.push('/')
    return result
  }

  const startSegments = segments.slice(0, segments.length - depth)
  const endSegments = segments.slice(segments.length - depth)

  const result: string[] = []
  if (startSegments.length > 0) {
    result.push('...', '/')
  }
  endSegments.forEach((seg, idx) => {
    if (idx > 0) result.push('/')
    result.push(seg)
  })
  if (result.length > 0) result.push('/')
  return result
}
