import clsx from 'clsx'
import * as Styled from './ActivityCheckbox.styled'
import { Icon } from '@ynput/ayon-react-components'

export interface ActivityCheckboxProps {
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const ActivityCheckbox = ({ checked, onChange }: ActivityCheckboxProps) => {
  return (
    <Styled.Checkbox className={clsx({ checked })}>
      <input checked={checked} disabled={false} onChange={onChange} type="checkbox" />
      <Icon icon={checked ? 'check_circle' : 'radio_button_unchecked'} />
    </Styled.Checkbox>
  )
}

export default ActivityCheckbox
