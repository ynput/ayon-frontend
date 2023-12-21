import { classNames } from 'primereact/utils'
import * as Styled from './MarketAddonCard.styled'
import Type from '/src/theme/typography.module.css'
import AddonIcon from '../AddonIcon/AddonIcon'
import { Icon } from '@ynput/ayon-react-components'

const MarketAddonCard = ({
  title,
  author,
  icon,
  isSelected,
  isOfficial,
  isVerified,
  isInstalled,
  isOutdated,
  isPlaceholder,
  ...props
}) => {
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
          {isInstalled && !isOutdated && (
            <Styled.Tag disabled className="installed">
              Installed
            </Styled.Tag>
          )}
          {isInstalled && isOutdated && <Styled.Tag className="update">Update</Styled.Tag>}
          {!isInstalled && <Styled.Tag className="install">Install</Styled.Tag>}
        </Styled.Buttons>
      )}
    </Styled.Container>
  )
}

export default MarketAddonCard
