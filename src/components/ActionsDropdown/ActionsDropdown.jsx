import { DefaultValueTemplate, Icon } from '@ynput/ayon-react-components'
import { DropdownHeader, DropdownItem, StyledDropdown } from './ActionsDropdown.styled'
import { classNames } from 'primereact/utils'

export const ActionsDropdownItem = ({ label, img, icon = 'manufacturing', header }) => {
  if (header) return <DropdownHeader>{label}</DropdownHeader>

  return (
    <DropdownItem>
      {img && <img src={img} alt={label} />}
      {!img && <Icon className="icon" name={icon || 'manufacturing'} />}
      <span>{label}</span>
    </DropdownItem>
  )
}

const ActionsDropdown = ({ options, isLoading, onAction }) => {
  return (
    <StyledDropdown
      disabled={isLoading}
      className={classNames('more', { isLoading: isLoading })}
      options={options}
      value={[]}
      placeholder=""
      itemTemplate={(option) => <ActionsDropdownItem {...option} />}
      valueTemplate={() => <DefaultValueTemplate placeholder="" />}
      onChange={(v) => onAction(v[0])}
    />
  )
}

export default ActionsDropdown
