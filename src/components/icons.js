const CellWithIcon = ({ icon, iconClassName, text }) => {
  return (
    <>
      <span
        className={`material-symbols-outlined ${iconClassName || ''}`}
        style={{ marginRight: '0.6rem' }}
      >
        {icon}
      </span>
      {text}
    </>
  )
}

export { CellWithIcon }
