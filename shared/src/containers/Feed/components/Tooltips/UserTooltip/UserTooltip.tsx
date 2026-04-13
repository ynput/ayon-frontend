import UserTooltipItem from '../UserTooltipItem'
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
      <UserTooltipItem name={name || ''} fullName={label} showSubtitle size={40} />
    </Styled.Popup>
  )
}

export default UserTooltip