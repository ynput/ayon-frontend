import UserImage from '../../../../UserImage'
import * as Styled from './UserTooltip.styled'

interface UserTooltipProps {
  name?: string
  label?: string
  pos: {
    top: number
    left: number
  }
}

const UserTooltip = ({ name, label, pos }: UserTooltipProps) => {
  return (
    <Styled.Popup style={{ ...pos }}>
      <UserImage name={name || ''} />{' '}
      <Styled.Content>
        <span>{label}</span>
        <span className={'label'}>{name}</span>
      </Styled.Content>
    </Styled.Popup>
  )
}

export default UserTooltip
