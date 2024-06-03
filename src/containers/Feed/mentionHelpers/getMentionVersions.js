import { getFuzzyDate } from '/src/components/Feed/ActivityDate'
import { productTypes } from '/src/features/project'
import getEntityTypeIcon from '/src/helpers/getEntityTypeIcon'

const getMentionVersions = (versions) => {
  return versions.map((v) => {
    const productType = productTypes[v?.product?.productType]
    const icon = productType?.icon || getEntityTypeIcon('version')

    return {
      type: 'version',
      label: v.name,
      image: v.thumbnailId,
      icon: icon,
      id: v.id,
      createdAt: v.createdAt,
      context: v.product?.name,
      keywords: [v.name, v.product?.name],
      suffix: getFuzzyDate(v.createdAt),
    }
  })
}

export default getMentionVersions
