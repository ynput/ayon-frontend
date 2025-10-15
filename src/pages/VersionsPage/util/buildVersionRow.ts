import { VersionNode } from '@shared/api/queries'
import { TableRow } from '@shared/containers'

export const buildVersionRow = (
  version: VersionNode,
  subRows?: TableRow[] | undefined,
): TableRow => ({
  id: version.id,
  name: version.name,
  label: `${version.product.name} - ${version.name}`,
  entityId: version.id,
  entityType: 'version',
  createdAt: version.createdAt,
  updatedAt: version.updatedAt,
  status: version.status,
  tags: version.tags,
  folderId: version.product.folderId,
  parents: version.parents?.slice(0, -1),
  attrib: version.attrib,
  ownAttrib: Object.keys(version.attrib || {}),
  subType: version.product.productType,
  hasReviewables: version.hasReviewables,
  subRows,
  links: {}, // TODO add links
})
