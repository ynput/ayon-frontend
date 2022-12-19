const CellWithIcon = ({ icon, iconClassName, text, textStyle, textClassName, className }) => {
  return (
    <span className={className || ''}>
      <span
        className={`material-symbols-outlined ${iconClassName || ''}`}
        style={{ marginRight: '0.6rem' }}
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
