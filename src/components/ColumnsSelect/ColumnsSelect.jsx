import { DefaultValueTemplate, Dropdown } from '@ynput/ayon-react-components'

const ValueTemplate = ({ selected, options = [], ...props }) => {
  return (
    <DefaultValueTemplate {...props} valueStyle={{ display: 'flex' }}>
      {selected.length > 0 ? (
        <span>
          Columns: {selected.length} / {options.length}
        </span>
      ) : (
        <span>Filter columns...</span>
      )}
    </DefaultValueTemplate>
  )
}

const ColumnsSelect = ({ placeholder = 'Filter columns...', ...props }) => {
  return (
    <Dropdown
      {...props}
      multiSelect
      valueTemplate={(value, selected) => (
        <ValueTemplate selected={selected} {...props} value={value} placeholder={placeholder} />
      )}
    />
  )
}

export default ColumnsSelect
