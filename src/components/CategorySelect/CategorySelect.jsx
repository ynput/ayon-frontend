import { DefaultValueTemplate, Dropdown, Icon } from '@ynput/ayon-react-components'

const IconsTemplate = ({ value, selected, isOpen, options, ...props }) => {
  return (
    <DefaultValueTemplate
      {...props}
      {...{ value, selected, isOpen }}
      valueStyle={{ display: 'flex' }}
    >
      {options
        ?.filter((option) => selected.includes(option.value))
        .map((option) => (
          <Icon icon={option.icon} key={option.value} />
        ))}
    </DefaultValueTemplate>
  )
}

const CategorySelect = ({ truncateAt = 3, ...props }) => {
  console.log(props)
  return (
    <Dropdown
      {...props}
      valueTemplate={(value, selected, isOpen) =>
        selected.length >= truncateAt ? (
          <IconsTemplate {...props} {...{ value, selected, isOpen }} />
        ) : null
      }
    />
  )
}

export default CategorySelect
