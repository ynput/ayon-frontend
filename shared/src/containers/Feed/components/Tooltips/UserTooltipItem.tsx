import UserImage from '../../../../components/UserImage'
import styled from 'styled-components'

const Wrapper = styled.span<{ $size: number }>`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);

  .thumbnail {
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;

    .icon {
      font-size: ${({ $size }) => Math.round($size * 0.58)}px;
    }
  }

  span {
    white-space: nowrap;
  }
`

const TextContent = styled.span`
  display: flex;
  flex-direction: column;

  .label {
    color: var(--md-sys-color-outline);
    font-size: 0.85em;
  }
`

interface UserTooltipItemProps {
  name: string
  fullName?: string
  /** Show username as subtitle below fullName */
  showSubtitle?: boolean
  /** Avatar size in px, default 24 */
  size?: number
}

const UserTooltipItem = ({ name, fullName, showSubtitle, size = 24 }: UserTooltipItemProps) => {
  return (
    <Wrapper $size={size}>
      <UserImage name={name} />
      {showSubtitle ? (
        <TextContent>
          <span>{fullName || name}</span>
          {fullName && <span className="label">{name}</span>}
        </TextContent>
      ) : (
        <span>{fullName || name}</span>
      )}
    </Wrapper>
  )
}

export default UserTooltipItem