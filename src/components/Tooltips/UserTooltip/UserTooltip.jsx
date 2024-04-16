import * as Styled from './UserTooltip.styled'
import UserImage from '/src/components/UserImage'

const UserTooltip = ({ name, label }) => {
  return (
    <>
      <UserImage name={name} />{' '}
      <Styled.Content>
        <span>{label}</span>
        <span className={'label'}>{name}</span>
      </Styled.Content>
    </>
  )
}

export default UserTooltip
