import { DefaultItemTemplate, Icon } from '@ynput/ayon-react-components'

export type AccessOption = {
  option: { value: string; label: string; tooltip?: string }
  selected?: string
}

const AccessOptionItem = ({ option, selected }: AccessOption) => {
  return (
    <DefaultItemTemplate
      option={option}
      selected={selected ? [selected] : []}
      dataKey={'value'}
      labelKey={'label'}
      value={[option.value]}
      endContent={
        option.tooltip && (
          <Icon
            icon="info"
            style={{ fontSize: 18, marginLeft: 'auto' }}
            data-tooltip={option.tooltip}
            data-tooltip-delay={0}
          />
        )
      }
    />
  )
}

export default AccessOptionItem
