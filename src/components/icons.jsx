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
      <span style={textStyle} className={textClassName}>
        {text}
      </span>
    </>
  )
}

export { CellWithIcon }
