import type { LinkEntity } from '@shared/components/LinksManager/LinksManager'

export const sortEntityLinksByPath = (links: LinkEntity[]) => {
  return [...links].sort((a, b) => {
    const aPath = a.parents.join('/') + a.label
    const bPath = b.parents.join('/') + b.label

    return aPath.localeCompare(bPath)
  })
}

export const isLinkEditable = (
  direction: 'in' | 'out',
  linkType: string,
  entityType: string,
): boolean => {
  const linkTypeParts = linkType.split('|')
  const [_name, outType, inType] = linkTypeParts
  if (direction === 'in') {
    return entityType === inType
  } else {
    return entityType === outType
  }
}
