import { getFuzzyDate } from '/src/components/Feed/ActivityDate'
import { productTypes } from '/src/features/project'
import getEntityTypeIcon from '/src/helpers/getEntityTypeIcon'

const getMentionVersions = (versions) => {
  const productType = productTypes[versions[0]?.product?.productType]
  const icon = productType?.icon || getEntityTypeIcon('version')

  return versions.map((v) => ({
    type: 'version',
    label: v.name,
    image: v.thumbnailId,
    icon: icon,
    id: v.id,
    createdAt: v.createdAt,
    context: v.product?.name,
    keywords: [v.name, v.product?.name],
    suffix: getFuzzyDate(v.createdAt),
  }))
}

export default getMentionVersions
