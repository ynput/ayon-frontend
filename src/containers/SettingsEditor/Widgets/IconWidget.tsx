import { upperFirst } from 'lodash'
import { DefaultItemTemplate, DefaultValueTemplate, IconSelect } from '@ynput/ayon-react-components'

type IconSelectProps = React.ComponentProps<typeof IconSelect> & { 'data-tooltip'?: string }

// "play_arrow" reads "Play arrow"; the stored value stays the icon's name
const getIconLabel = (icon: string) => upperFirst(icon.replace(/_/g, ' '))

// An icon picker that shows icon names as words, with the name itself in the tooltip
export const IconWidget = ({ 'data-tooltip': tooltip, ...props }: IconSelectProps) => {
  // IconSelect hands its other props on to its Dropdown, so these replace its own templates
  const templates = {
    valueTemplate: (value: string[], selected: string[], isOpen: boolean) => {
      const icons = (isOpen ? selected : value) || []
      return (
        <DefaultValueTemplate value={icons} isOpen={isOpen} displayIcons={icons.slice(0, 1)}>
          {icons[0] && getIconLabel(icons[0])}
        </DefaultValueTemplate>
      )
    },
    itemTemplate: (option: { value: string }, isActive: boolean, isSelected: boolean) => (
      <DefaultItemTemplate
        option={{ value: option.value, icon: option.value, label: getIconLabel(option.value) }}
        dataKey="value"
        labelKey="label"
        selected={isSelected ? [option.value] : []}
        value={isActive ? [option.value] : []}
      />
    ),
  } as Partial<IconSelectProps>

  return <IconSelect {...props} {...templates} data-tooltip={tooltip || props.value?.[0]} />
}
