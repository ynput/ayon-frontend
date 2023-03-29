import { Dropdown } from '@ynput/ayon-react-components'

//eslint-disable-next-line no-unused-vars
const TypeEditor = ({ value, options, onChange, style, disabled, placeholder, isChanged }) => {
  const optionsTypes = Object.values(options).map((t) => ({
    name: t?.name,
    label: t?.name,
    icon: t?.icon,
  }))

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
    />
  )
}
export default TypeEditor
