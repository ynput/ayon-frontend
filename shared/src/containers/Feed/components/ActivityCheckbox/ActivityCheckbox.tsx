import clsx from 'clsx'
import * as Styled from './ActivityCheckbox.styled'
import { DoneCheckbox } from '@shared/components'

export interface ActivityCheckboxProps {
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const ActivityCheckbox = ({ checked, onChange }: ActivityCheckboxProps) => {
  return (
    <Styled.Checkbox className={clsx({ checked })}>
      <input checked={checked} disabled={false} onChange={onChange} type="checkbox" />
      <DoneCheckbox checked={checked} />
    </Styled.Checkbox>
  )
}

export default ActivityCheckbox
