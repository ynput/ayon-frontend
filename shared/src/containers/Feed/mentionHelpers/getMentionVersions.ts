import { getFuzzyDate } from '../components/ActivityDate'
import { getEntityTypeIcon } from '@shared/util'
import { VersionSuggestionItem } from '@shared/api'
import { ProjectContextProps } from '@shared/context/ProjectContext'

const getMentionVersions = (versions: VersionSuggestionItem[] = [], project: ProjectContextProps) => {
  return versions?.map((v) => {
    if (!v.parent) {
      return null
    }

    const productType = project.productTypes?.find((pt) => pt.name === v.parent?.productType)

    const icon = productType?.icon || getEntityTypeIcon('version')
    const context = v.parent?.name
    const label = v.name || v.version
    const suffix = v.createdAt && getFuzzyDate(new Date(v.createdAt))
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
