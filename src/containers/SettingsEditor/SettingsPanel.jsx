import { useEffect } from 'react'
import useLocalStorage from '@hooks/useLocalStorage'
import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const PanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0 !important;

  &.selected {
    > .panel-conent {
      border-left-color: var(--color-changed) !important;
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
    padding: 0;
    margin-left: 8px;
    border: 0;
    font-size: 1rem;
    color: white;
    white-space: nowrap;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--base-gap-small);

    .new-object {
      font-style: italic;
      color: yellow;
    }
  }

  small {
    margin-left: 20px;
    opacity: 0.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .panel-toggler {
    border-radius: 50%;
  }
`

const PanelContent = styled.div`
  width: 100%;
  overflow: auto;
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
  objId,
}) => {
  const toggleIcon = expanded ? 'expand_more' : 'chevron_right'

  return (
    <PanelWrapper className={`panel ${className}`} data-fieldid={objId}>
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
  currentId,
}) => {
  const [expandedObjects, setExpandedObjects] = useLocalStorage('expanded-settings-keys', [])

  const onToggle = () => {
    if (expandedObjects.includes(objId)) {
      setExpandedObjects(expandedObjects.filter((id) => id !== objId))
    } else {
      setExpandedObjects([...expandedObjects, objId])
    }
  }

  const expanded = expandedObjects.includes(objId)

  useEffect(() => {
    if (!currentId) return
    if (currentId.startsWith(objId + '_') && !expandedObjects.includes(objId)) {
      console.log('expanding', objId)
      setExpandedObjects([...expandedObjects, objId])
    }
  }, [currentId, objId, expandedObjects])

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
      objId={objId}
    >
      {children}
    </Panel>
  )
}

export default SettingsPanel
