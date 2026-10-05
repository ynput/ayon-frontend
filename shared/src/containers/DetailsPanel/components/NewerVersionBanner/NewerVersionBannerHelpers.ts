import type { DetailsPanelEntityData } from '@shared/api'
import type { LatestVersion } from './NewerVersionBanner'

export const getNewerLatestVersion = (
  entity: DetailsPanelEntityData | undefined,
): LatestVersion | undefined => {
  const current = entity?.version?.version
  const latest = entity?.product?.latestVersion
  if (entity?.entityType !== 'version' || !current || current <= 0 || !latest?.active) return
  return latest.version > current ? latest : undefined
}
