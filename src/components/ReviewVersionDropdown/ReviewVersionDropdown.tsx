import { Dropdown, Icon } from '@ynput/ayon-react-components'
import * as Styled from './ReviewVersionDropdown.styled'

type ReviewVersionDropdownProps = {
  options: { value: string; label: string }[]
  value: string | null
  valueIcon?: string
  valueColor?: string
  onChange: (value: string) => void
  prefix?: string
  placeholder?: string
  tooltip?: string
  valueProps?: Record<string, any>
}

const ReviewVersionDropdown = ({
  options,
  value,
  valueIcon = '',
  valueColor,
  onChange,
  prefix = 'Viewing: ',
  placeholder = 'Select a version',
  tooltip = 'Viewing version',
  valueProps = {},
  ...props
}: ReviewVersionDropdownProps) => {
  return (
    <Dropdown
      options={options}
      value={value ? [value] : []}
      onChange={(v) => onChange(String(v[0]))}
      search={options.length > 20}
      searchFields={['label', 'value']}
      activateKeys={['Enter']}
      {...props}
      valueTemplate={(value, selected, isOpen) => (
        <div data-tooltip={tooltip} data-tooltip-position="bottom"  style={{ height: '100%' }}>
          <Styled.VersionValueTemplate
            value={selected || value}
            isOpen={isOpen}
            placeholder={placeholder}
            {...valueProps}
          >
            {prefix}
            {valueIcon && <Icon icon={valueIcon} style={valueColor ? {color: valueColor} : {}}/>}
            {options.find((option) => option.value === (selected || value)[0])?.label}
          </Styled.VersionValueTemplate>
        </div>
      )}
    />
  )
}

export default ReviewVersionDropdown
