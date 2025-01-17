import { EnumTemplate, Icon } from '@ynput/ayon-react-components'

type Props = {
  icon: string
  color: string
  text: string

  handleExpandIconClick: Function
}

const DropdownCell = ({ icon, color, text, handleExpandIconClick }: Props) => {
      // <Icon icon={icon} style={{ color: color, padding: '0px 4px 0 2px' }} />
      // <span style={{ color, flexGrow: 1 }}>{text}</span>
  return (
    <div style={{display: 'flex'}}>
      <EnumTemplate
        option={{
          color: color,
          icon: icon,
          label: text,
          value: text,
          // handleExpandIconClick = { handleExpandIconClick },
        }}
      />

      <Icon
      icon="expand_more"
      // @ts-ignore
      onClick={handleExpandIconClick} />
    </div>
  )
}

export default DropdownCell
