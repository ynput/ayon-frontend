const CellWithIcon = ({ icon, iconClassName, text, textStyle }) => {
  return (
    <>
      <span
        className={`material-symbols-outlined ${iconClassName || ''}`}
        style={{ marginRight: '0.6rem' }}
      >
        {icon}
      </span>
      <span style={textStyle}>{text}</span>
    </>
  )
}

export { CellWithIcon }
