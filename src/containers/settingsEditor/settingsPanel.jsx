import { Panel } from 'primereact/panel'
import { useLocalStorage } from '../../utils'

const SettingsPanel = ({
  objId,
  title,
  description,
  children,
  layout,
  revertButton,
  className = '',
  onClick,
}) => {
  const [expandedObjects, setExpandedObjects] = useLocalStorage(
    'expanded-settings-keys',
    []
  )

  const onToggle = () => {
    if (expandedObjects.includes(objId))
      setExpandedObjects(expandedObjects.filter((id) => id !== objId))
    else setExpandedObjects([...expandedObjects, objId])
  }

  const expanded = expandedObjects.includes(objId)

  const panelHeaderTemplate = (options) => {
    const toggleIcon = options.collapsed
      ? 'pi pi-chevron-right'
      : 'pi pi-chevron-down'
    return (
      <div
        className="p-panel-header form-panel-header"
        style={{
          justifyContent: 'start',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={(evt) => {
          if (evt.detail === 1 && onClick) 
              onClick()
          else if (evt.detail === 2) 
            options.onTogglerClick(evt)
        }}
      >
        <button
          className={options.togglerClassName}
          onClick={options.onTogglerClick}
        >
          <span className={toggleIcon}></span>
        </button>
        <h4>{title}</h4>
        <div style={{ flex: 1 }}></div>
        <small>{description}</small>
        {revertButton && revertButton}
      </div>
    )
  }

  let nclass = `form-object-field ${layout ? `layout-${layout}` : ''} ${
    className || ''
  } `

  return (
    <Panel
      headerTemplate={panelHeaderTemplate}
      onToggle={onToggle}
      toggleable
      collapsed={!expanded}
      transitionOptions={{ timeout: 0 }}
      className={nclass}
    >
      {children}
    </Panel>
  )
}

export default SettingsPanel
