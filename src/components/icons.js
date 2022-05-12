const CellWithIcon = ({ icon, iconClassName, text }) => {
  return (
    <>
      <span
        className={`material-symbols-outlined ${
          iconClassName || 'color-ternary'
        }`}
        style={{
          display: 'inline',
          fontSize: '1.3rem',
          marginRight: '0.5rem',
          verticalAlign: 'text-top',
        }}
      >
        {icon}
      </span>
      {text}
    </>
  )
}

export { CellWithIcon }
