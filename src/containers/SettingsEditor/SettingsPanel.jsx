//import { Panel } from 'primereact/panel'
import useLocalStorage from '/src/hooks/useLocalStorage'
import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const PanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0 !important;

  &.selected {
    > .panel-conent {
      border-left-color: var(--color-hl-00) !important;
    }
  }
`

const PanelHeader = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  cursor: pointer;
  min-height: 32px;
  max-height: 32px;
  background-color: #434a56;
  border-radius: 4px;
  user-select: none;
  border-left: 4px solid transparent;
  padding: 0 8px;

  h4 {
    margin: 0;
    padding:0;
    margin-left: 8px;
    border: 0;
    font-size: 1rem

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    span {
      font-size: 0.8rem;
      border-radius: 4px;
      padding: 0 4px;
      color: black;
    }

    .new-object
      font-style: italic
      color: var(--color-hl-error)
  }

  small {
    margin-left: 20px;
    opacity: 0.4;
  }

  .panel-toggler {
    border-radius: 50%;

`

const PanelContent = styled.div`
  display: flex;
  flex-direction: column;
  border-left: 1px dotted #434a56;
  padding: 10px 0;
  padding-left: 20px;
  margin: 0;

  > * {
    flex: 1;
  }
`

const Panel = ({
  header,
  onToggle,
  expanded,
  className,
  children,
  onHeaderClick,
  onContextMenu,
}) => {
  const toggleIcon = expanded ? 'expand_more' : 'chevron_right'

  return (
    <PanelWrapper className={`panel ${className}`}>
      <PanelHeader
        className="panel-header"
        onContextMenu={onContextMenu}
        onClick={(evt) => {
          // evt.preventDefault()
          // evt.stopPropagation()
          if (evt.detail === 1 && onHeaderClick) onHeaderClick()
          else if (evt.detail === 2) onToggle(evt)
        }}
      >
        <Icon icon={toggleIcon} onClick={onToggle} className="panel-toggler" />
        {header}
      </PanelHeader>

      {expanded && <PanelContent className="panel-content">{children}</PanelContent>}
    </PanelWrapper>
  )
}

const SettingsPanel = ({
  objId,
  title,
  description,
  children,
  layout,
  enabledToggler,
  className = '',
  onClick,
  onContextMenu,
}) => {
  const [expandedObjects, setExpandedObjects] = useLocalStorage('expanded-settings-keys', [])

  const onToggle = () => {
    if (expandedObjects.includes(objId))
      setExpandedObjects(expandedObjects.filter((id) => id !== objId))
    else setExpandedObjects([...expandedObjects, objId])
  }

  const expanded = expandedObjects.includes(objId)

  const panelHeader = (
    <>
      {enabledToggler}
      <h4>{title}</h4>
      <div style={{ flex: 1 }}></div>
      <small>{description}</small>
    </>
  )

  let nclass = `form-object-field ${layout ? `layout-${layout}` : ''} ${className || ''} `

  return (
    <Panel
      header={panelHeader}
      onToggle={onToggle}
      expanded={expanded}
      className={nclass}
      onHeaderClick={onClick}
      onContextMenu={onContextMenu}
    >
      {children}
    </Panel>
  )
}

export default SettingsPanel
