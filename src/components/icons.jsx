const CellWithIcon = ({
  icon,
  iconClassName,
  text,
  textStyle,
  textClassName,
}) => {
  return (
    <>
      <span
        className={`material-symbols-outlined ${iconClassName || ''}`}
        style={{ marginRight: '0.6rem' }}
      >
        {icon}
      </span>
      <span style={textStyle} className={`cell-with-icon-text ${textClassName}`}>
        {text}
      </span>
    </>
  )
}

export { CellWithIcon }
