import { DefaultValueTemplate } from '@ynput/ayon-react-components'
import { DropdownHeader, DropdownItem, StyledDropdown } from './ActionsDropdown.styled'
import clsx from 'clsx'
import { upperFirst } from 'lodash'
import ActionIcon from '@/containers/Actions/ActionIcon'

export const ActionsDropdownItem = ({ label, icon, header }) => {
  if (header) return <DropdownHeader>{upperFirst(label)}</DropdownHeader>

  return (
    <DropdownItem>
      <ActionIcon icon={icon} />
      <span>{label}</span>
    </DropdownItem>
  )
}

const ActionsDropdown = ({ options, isLoading, onAction }) => {
  return (
    <StyledDropdown
      disabled={isLoading}
      className={clsx('more', { loading: isLoading })}
      options={options}
      maxOptionsShown={100}
      value={[]}
      placeholder=""
      itemTemplate={(option) => <ActionsDropdownItem {...option} />}
      valueTemplate={() => <DefaultValueTemplate placeholder="" />}
      onChange={(v) => onAction(v[0])}
      buttonProps={{ ['data-tooltip']: 'All actions' }}
    />
  )
}

export default ActionsDropdown
