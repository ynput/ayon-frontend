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
}) => {
  return (
    <span
      className={className || ''}
      style={{ alignItems: 'center', position: 'relative', overflow: 'hidden', ...style }}
    >
      <Icon
        icon={icon}
        className={iconClassName || ''}
        style={{ marginRight: '0.6rem', ...iconStyle }}
      />
      <span
        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...textStyle }}
        className={`cell-with-icon-text ${textClassName}`}
      >
        {text}
      </span>
    </span>
  )
}

export { CellWithIcon }
