import clsx from 'clsx'
import * as Styled from './MarketAddonCard.styled'
import Type from '@/theme/typography.module.css'
import AddonIcon from '../AddonIcon/AddonIcon'
import { ButtonProps, Icon } from '@ynput/ayon-react-components'
import { upperFirst } from 'lodash'
import { HTMLAttributes } from 'react'
import CloudButton from '@components/CloudButton'

export type ListItemType = 'addon' | 'release'

interface MarketAddonCardProps extends HTMLAttributes<HTMLDivElement> {
  type: ListItemType
  title: string
  name: string
  latestVersion?: string
  author?: string
  icon?: string
  isSelected?: boolean
  isOfficial?: boolean
  isVerified?: boolean
  isDownloaded?: boolean
  isOutdated?: boolean
  isPlaceholder?: boolean
  isWaiting?: boolean
  isDownloading?: boolean
  isFailed?: boolean
  isFinished?: boolean
  isActive?: boolean
  onDownload: (name: string, version: string) => void
}

export const MarketAddonCard = ({
  type,
  title,
  name,
  latestVersion,
  author,
  icon,
  isSelected,
  isOfficial,
  isVerified,
  isDownloaded,
  isOutdated,
  isPlaceholder,
  isWaiting, // waiting to be downloaded/updated by update all
  isDownloading,
  isFailed,
  isFinished,
  isActive,
  onDownload,
  ...props
}: MarketAddonCardProps) => {
  let state = 'download'
  if (isDownloaded && !isOutdated) state = 'downloaded'
  if (isDownloaded && isOutdated) state = 'update'
  if (isWaiting) state = 'pending'
  if (isDownloading) state = isDownloaded && isOutdated ? 'updating' : 'downloading'
  if (isFailed) state = 'failed'
  if (isFinished) state = 'finished'

  let stateIcon = null
  if (isDownloading) stateIcon = 'sync'
  if (isFailed) stateIcon = 'error'
  if (isFinished) stateIcon = 'check_circle'

  let stateVariant: ButtonProps['variant'] = 'text'
  if (state === 'download') stateVariant = 'surface'
  if (state === 'failed') stateVariant = 'danger'
  if (state === 'update') stateVariant = 'filled'

  const handleActionClick = () => {
    if (['download', 'update'].includes(state) && latestVersion) {
      onDownload(name, latestVersion)
    }
  }

  return (
    <Styled.Container
      {...props}
      className={clsx(
        props.className,
        { selected: isSelected, loading: isPlaceholder },
        'no-shimmer',
      )}
    >
      <AddonIcon isPlaceholder={isPlaceholder} size={32} src={icon} alt={title + ' icon'} />
      <Styled.Content className={clsx({ loading: isPlaceholder })}>
        <Styled.TitleWrapper className="header">
          <Styled.Title className={Type.titleMedium}>{title}</Styled.Title>
          {isOfficial && <img src="/favicon-32x32.png" width={15} height={15} />}
          {isVerified && !isOfficial && (
            <Icon icon="new_release" style={{ color: 'var(--md-sys-color-secondary)' }} />
          )}
        </Styled.TitleWrapper>
        <Styled.AuthorWrapper className="details">
          <Styled.Author className={Type.labelMedium}>{author}</Styled.Author>
        </Styled.AuthorWrapper>
      </Styled.Content>
      {!isPlaceholder && (
        <Styled.Buttons>
          {isActive ? (
            <Styled.Tag
              variant={stateVariant}
              className={state}
              onClick={handleActionClick}
              disabled={isWaiting}
            >
              {stateIcon && <Icon icon={stateIcon} />}
              {upperFirst(state)}
            </Styled.Tag>
          ) : (
            <CloudButton
              featureId="release-installer"
              data-tooltip="Subscribe to Ynput Cloud to install previous releases"
              data-tooltip-delay={0}
            />
          )}
        </Styled.Buttons>
      )}
    </Styled.Container>
  )
}
