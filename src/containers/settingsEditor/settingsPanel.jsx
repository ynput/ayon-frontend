import { useRef } from 'react'
import { Panel } from 'primereact/panel'
import { ContextMenu } from 'primereact/contextmenu'
import { useLocalStorage } from '../../utils'

const SettingsPanel = ({
  objId,
  title,
  description,
  children,
  layout,
  contextMenuModel,
  enabledToggler,
  className = '',
  onClick,
}) => {
  const contextMenuRef = useRef(null)
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
      <>
        <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
        <div
          className="p-panel-header form-panel-header"
          onContextMenu={(e) => contextMenuRef.current.show(e)}
          style={{
            justifyContent: 'start',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={(evt) => {
            if (evt.detail === 1 && onClick) onClick()
            else if (evt.detail === 2) options.onTogglerClick(evt)
          }}
        >
          <button
            className={options.togglerClassName}
            onClick={options.onTogglerClick}
          >
            <span className={toggleIcon}></span>
          </button>
          { enabledToggler }
          <h4>{title}</h4>
          <div style={{ flex: 1 }}></div>
          <small>{description}</small>
        </div>
      </>
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
