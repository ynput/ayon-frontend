import { classNames } from 'primereact/utils'
import * as Styled from './MarketAddonCard.styled'
import Type from '@/theme/typography.module.css'
import AddonIcon from '../AddonIcon/AddonIcon'
import { Icon } from '@ynput/ayon-react-components'
import { upperFirst } from 'lodash'

const MarketAddonCard = ({
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
  onDownload,
  ...props
}) => {
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

  let stateVariant = 'light'
  if (state === 'download') stateVariant = 'surface'
  if (state === 'failed') stateVariant = 'danger'
  if (state === 'update') stateVariant = 'filled'

  const handleActionClick = () => {
    if (['download', 'update'].includes(state)) {
      onDownload(name, latestVersion)
    }
  }

  return (
    <Styled.Container {...props} className={classNames({ isSelected, isPlaceholder })}>
      <AddonIcon isPlaceholder={isPlaceholder} size={32} src={icon} alt={title + ' icon'} />
      <Styled.Content className="content">
        <Styled.TitleWrapper className="header">
          <Styled.Title className={Type.titleMedium}>{title}</Styled.Title>
          {isOfficial && <img src="/favicon-32x32.png" width={15} height={15} />}
          {isVerified && !isOfficial && (
            <Icon icon="new_release" style={{ color: '    var(--md-sys-color-secondary)' }} />
          )}
        </Styled.TitleWrapper>
        <Styled.AuthorWrapper className="details">
          <Styled.Author className={Type.labelMedium}>{author}</Styled.Author>
        </Styled.AuthorWrapper>
      </Styled.Content>
      {!isPlaceholder && (
        <Styled.Buttons>
          <Styled.Tag
            variant={stateVariant}
            className={state}
            onClick={handleActionClick}
            disabled={isWaiting}
          >
            {stateIcon && <Icon icon={stateIcon} />}
            {upperFirst(state)}
          </Styled.Tag>
        </Styled.Buttons>
      )}
    </Styled.Container>
  )
}

export default MarketAddonCard
