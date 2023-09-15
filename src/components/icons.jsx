import { Icon } from '@ynput/ayon-react-components'

const CellWithIcon = ({
  icon,
  iconClassName,
  text,
  textStyle,
  textClassName,
  className,
  style,
  iconStyle,
  name,
}) => {
  return (
    <span
      className={className || ''}
      style={{
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <Icon
        icon={icon}
        className={iconClassName || ''}
        style={{ marginRight: '0.6rem', ...iconStyle }}
      />
      <span
        title={name}
        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...textStyle }}
        className={`cell-with-icon-text ${textClassName}`}
      >
        {text || name}
      </span>
    </span>
  )
}

export { CellWithIcon }
