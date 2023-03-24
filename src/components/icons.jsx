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
      <span
        className={`material-symbols-outlined ${iconClassName || ''}`}
        style={{ marginRight: '0.6rem', ...iconStyle }}
      >
        {icon}
      </span>
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
