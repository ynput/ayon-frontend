import { FC } from 'react'
import { InfoMessage } from '@shared/components/InfoMessage'
import type { DetailsPanelEntityData } from '@shared/api'

export type LatestVersion = NonNullable<
  NonNullable<DetailsPanelEntityData['product']>['latestVersion']
>

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
      compact
      style={{ margin: 'var(--padding-m) var(--padding-m) 0' }}
      message={`A newer version (${latestVersion.name}) exists.`}
      action={
        jump
          ? {
              label: `Go to ${latestVersion.name}`,
              icon: 'arrow_right_alt',
              iconPosition: 'right',
              callback: jump,
            }
          : undefined
      }
    />
  )
}

export default NewerVersionBanner
