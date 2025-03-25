import { Dropdown } from '@ynput/ayon-react-components'
import { forwardRef } from 'react'
import { useSelector } from 'react-redux'

//eslint-disable-next-line no-unused-vars
const TypeEditor = forwardRef(
  (
    {
      value,
      options,
      onChange,
      style,
      mainStyle,
      disabled,
      placeholder,
      isChanged,
      align,
      type,
      ...props
    },
    ref,
  ) => {
    const project = useSelector((state) => state.project)
    const order = project[type + 'sOrder']

    let optionsTypes = []
    if (order) {
      // Create a new object with ordered keys
      // adding the rest of the keys that are not in order to the end
      const orderedOptions = [...order, ...Object.keys(options).filter((t) => !order.includes(t))]

      // Create optionsTypes in one loop
      optionsTypes = orderedOptions.map((t) => ({
        name: t,
        label: options[t]?.name,
        icon: options[t]?.icon,
      }))
    } else {
      // default ordering
      optionsTypes = Object.values(options).map((t) => ({
        name: t?.name,
        label: t?.name,
        icon: t?.icon,
      }))
    }

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
        ref={ref}
        {...props}
      />
    )
  },
)

TypeEditor.displayName = 'TypeEditor'

export default TypeEditor
