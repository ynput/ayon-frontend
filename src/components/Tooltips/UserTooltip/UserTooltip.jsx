import * as Styled from './UserTooltip.styled'
import UserImage from '@components/UserImage'

const UserTooltip = ({ name, label, pos }) => {
  return (
    <Styled.Popup style={{ ...pos }}>
      <UserImage name={name} />{' '}
      <Styled.Content>
        <span>{label}</span>
        <span className={'label'}>{name}</span>
      </Styled.Content>
    </Styled.Popup>
  )
}

export default UserTooltip
