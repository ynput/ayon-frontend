import './layout.sass'

const Section = ({ className, size = null, style = {}, ...props }) => {
  const sectionStyle = { ...style }
  if (size) sectionStyle['flexBasis'] = size
  return (
    <div className={`ay-section ${className || ''}`} style={sectionStyle}>
      {props.children}
    </div>
  )
}

const Toolbar = ({ ...props }) => {
  return <nav className="ay-toolbar">{props.children}</nav>
}

const Panel = ({ className = '', style = {}, size = null, ...props }) => {
  const panelStyle = { ...style }
  if (size) panelStyle['flexBasis'] = size
  else panelStyle['flexGrow'] = 1

  return (
    <div className={`ay-panel ${className}`} style={panelStyle}>
      {props.children}
    </div>
  )
}

const ScrollArea = ({ className, style = {}, ...props }) => {
  return (
    <div className={`ay-scrollarea ${className}`} style={style}>
      {props.children}
    </div>
  )
}

export { Section, Toolbar, Panel, ScrollArea }
