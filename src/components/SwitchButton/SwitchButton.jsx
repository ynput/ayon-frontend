import * as Styled from './SwitchButton.styled'
import { InputSwitch } from '@ynput/ayon-react-components'

const SwitchButton = ({ label, value, disabled, onClick, ...props }) => {
  const handleChange = (e) => {
    // prevent click events from input
    if (e.target.tagName === 'INPUT') return

    onClick()
  }

  return (
    <Styled.ButtonWrapper {...props} selected={value} disabled={disabled} onClick={handleChange}>
      {label}
      <InputSwitch checked={value} compact disabled={disabled} readOnly />
    </Styled.ButtonWrapper>
  )
}

export default SwitchButton
