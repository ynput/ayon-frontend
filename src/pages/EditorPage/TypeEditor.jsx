import { Dropdown } from '@ynput/ayon-react-components'

//eslint-disable-next-line no-unused-vars
const TypeEditor = ({
  value,
  options,
  onChange,
  style,
  mainStyle,
  disabled,
  placeholder,
  isChanged,
  align,
}) => {
  const optionsTypes = Object.values(options).map((t) => ({
    name: t?.name,
    label: t?.name,
    icon: t?.icon,
  }))

  // sort by name alphabetically
  optionsTypes.sort((a, b) => {
    const nameA = a.name.toLowerCase()
    const nameB = b.name.toLowerCase()
    if (nameA < nameB) {
      return -1
    }
    if (nameA > nameB) {
      return 1
    }

    return 0
  })

  return (
    <Dropdown
      options={optionsTypes}
      dataKey="name"
      value={value}
      valueStyle={style}
      onChange={(v) => onChange(v[0])}
      disabled={disabled}
      isChanged={isChanged}
      placeholder={placeholder}
      valueIcon={options[value]?.icon}
      widthExpand
      search
      searchFields={['name']}
      emptyMessage="None Set"
      style={mainStyle}
      align={align}
    />
  )
}
export default TypeEditor
