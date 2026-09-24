import { FC } from 'react'
import { InfoMessage } from '@shared/components/InfoMessage'
import type { DetailsPanelEntityData } from '@shared/api'

type LatestVersion = NonNullable<NonNullable<DetailsPanelEntityData['product']>['latestVersion']>

export const getNewerLatestVersion = (
  entity: DetailsPanelEntityData | undefined,
): LatestVersion | undefined => {
  const current = entity?.version?.version
  const latest = entity?.product?.latestVersion
  if (entity?.entityType !== 'version' || !current || current <= 0 || !latest?.active) return
  return latest.version > current ? latest : undefined
}

export type ResolveVersionJump = (versionId: string) => (() => void) | undefined

interface NewerVersionBannerProps {
  latestVersion: LatestVersion
  resolveVersionJump?: ResolveVersionJump
}

export const NewerVersionBanner: FC<NewerVersionBannerProps> = ({
  latestVersion,
  resolveVersionJump,
}) => {
  const jump = resolveVersionJump?.(latestVersion.id)

  return (
    <InfoMessage
      variant="info"
      style={{ margin: 'var(--padding-m) var(--padding-m) 0' }}
      message={`A newer version (${latestVersion.name}) exists.`}
      action={
        jump
          ? { label: `Go to ${latestVersion.name}`, icon: 'arrow_forward', callback: jump }
          : undefined
      }
    />
  )
}

export default NewerVersionBanner
