import {
  DefaultValueTemplate,
  DefaultValueTemplateProps,
  Dropdown,
  DropdownProps,
  Icon,
} from '@ynput/ayon-react-components'

interface IconsTemplateProps extends DefaultValueTemplateProps {
  selected: string[]
  options: { value: string; icon: string }[]
}

const IconsTemplate = ({ value, selected, isOpen, options, ...props }: IconsTemplateProps) => {
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

interface CategorySelectProps extends DropdownProps {
  truncateAt?: number
}

const CategorySelect = ({ truncateAt = 3, ...props }: CategorySelectProps) => {
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
