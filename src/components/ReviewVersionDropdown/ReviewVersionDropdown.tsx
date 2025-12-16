import { Dropdown, Icon } from '@ynput/ayon-react-components'
import * as Styled from './ReviewVersionDropdown.styled'
import { $Any } from '@/types'

type ReviewVersionDropdownProps = {
  options: { value: string; label: string }[]
  value: string | null
  valueIcon?: string
  valueColor?: string
  onChange: (value: string) => void
  selectRef?: $Any
  prefix?: string
  placeholder?: string
  tooltip?: string
  shortcut?: string
  valueProps?: Record<string, any>
}

const ReviewVersionDropdown = ({
  options,
  value,
  valueIcon = '',
  valueColor,
  onChange,
  selectRef = null,
  prefix = 'Viewing: ',
  placeholder = 'Select a version',
  tooltip = 'Viewing version',
  shortcut = 'W',
  valueProps = {},
  ...props
}: ReviewVersionDropdownProps) => {
  return (
    <Dropdown
      options={options}
      value={value ? [value] : []}
      onChange={(v) => onChange(String(v[0]))}
      ref={selectRef}
      search={options.length > 20}
      searchFields={['label', 'value']}
      activateKeys={['Enter']}
      {...props}
      valueTemplate={(value, selected, isOpen) => (
        <div data-tooltip={tooltip} data-tooltip-position="bottom" data-shortcut={shortcut} style={{ height: '100%' }}>
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
