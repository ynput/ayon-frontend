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
    <span className={className || ''} style={{ alignItems: 'center', ...style }}>
      <span
        className={`material-symbols-outlined ${iconClassName || ''}`}
        style={{ marginRight: '0.6rem', ...iconStyle }}
      >
        {icon}
      </span>
      <span style={textStyle} className={`cell-with-icon-text ${textClassName}`}>
        {text}
      </span>
    </span>
  )
}

export { CellWithIcon }
