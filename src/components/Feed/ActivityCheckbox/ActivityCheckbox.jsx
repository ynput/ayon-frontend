import clsx from 'clsx'
import * as Styled from './ActivityCheckbox.styled'
import { Icon } from '@ynput/ayon-react-components'

const ActivityCheckbox = ({ checked, onChange }) => {
  return (
    <Styled.Checkbox className={clsx({ checked })}>
      <input checked={checked} disabled={false} onChange={onChange} type="checkbox" />
      <Icon icon={checked ? 'check_circle' : 'radio_button_unchecked'} />
    </Styled.Checkbox>
  )
}

export default ActivityCheckbox
