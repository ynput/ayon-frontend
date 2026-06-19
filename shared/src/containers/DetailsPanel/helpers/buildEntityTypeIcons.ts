import type { EntityTypeIcons } from '@shared/containers'
import type { ProjectInfo } from './mergeProjectInfo'

const toIconMap = (types: { name: string; icon?: string | null }[]): Record<string, string> =>
  types
    .filter((type) => !!type.icon)
    .reduce((acc, type) => ({ ...acc, [type.name]: type.icon as string }), {})

const buildEntityTypeIcons = (projectInfo: ProjectInfo): EntityTypeIcons => ({
  task: toIconMap(projectInfo.taskTypes),
  folder: toIconMap(projectInfo.folderTypes),
  product: toIconMap(projectInfo.productTypes),
})

export default buildEntityTypeIcons
