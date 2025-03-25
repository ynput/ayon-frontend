import { forwardRef } from 'react'
import * as Styled from './MarketAddonCard.styled'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import Type from '@/theme/typography.module.css'

interface MarketAddonCardGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  author?: string
  createdAt?: string
  isOfficial?: boolean
  isVerified?: boolean
  isExpanded: boolean
  isPlaceholder: boolean
}

export const MarketAddonCardGroup = forwardRef<HTMLDivElement, MarketAddonCardGroupProps>(
  (
    { title, author, createdAt, isOfficial, isVerified, isExpanded, isPlaceholder, ...props },
    ref,
  ) => {
    return (
      <Styled.Container
        className={clsx(props.className, { loading: isPlaceholder }, 'no-shimmer')}
        {...props}
        ref={ref}
      >
        <Icon
          icon={'expand_more'}
          style={{
            rotate: isExpanded ? '0deg' : '-90deg',
          }}
        />
        <Styled.Content className={clsx({ loading: isPlaceholder })}>
          <Styled.TitleWrapper className="header">
            <Styled.Title className={Type.titleMedium}>{title}</Styled.Title>
            {isOfficial && <img src="/favicon-32x32.png" width={15} height={15} />}
            {isVerified && !isOfficial && (
              <Icon icon="new_release" style={{ color: 'var(--md-sys-color-secondary)' }} />
            )}
          </Styled.TitleWrapper>
          <Styled.AuthorWrapper className="details">
            <Styled.Author className={Type.labelMedium}>
              {author} {author && createdAt && '-'} {createdAt}
            </Styled.Author>
          </Styled.AuthorWrapper>
        </Styled.Content>
      </Styled.Container>
    )
  },
)
