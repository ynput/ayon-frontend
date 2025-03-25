import { getFuzzyDate } from '@components/Feed/ActivityDate'
import { productTypes } from '@state/project'
import getEntityTypeIcon from '@helpers/getEntityTypeIcon'

const getMentionVersions = (versions) => {
  return versions.map((v) => {
    const productType = productTypes[v?.parent?.productType]
    const icon = productType?.icon || getEntityTypeIcon('version')
    const context = v.parent?.name
    const label = v.name || v.version
    const suffix = getFuzzyDate(v.createdAt)
    const fullSearchString = `${context} ${label} ${suffix}`
    const keywords = [v.name, v.version, v.parent?.name, fullSearchString]

    return {
      type: 'version',
      id: v.id,
      createdAt: v.createdAt,
      label,
      icon,
      context,
      suffix,
      keywords,
      relevance: v.relevance,
    }
  })
}

export default getMentionVersions
