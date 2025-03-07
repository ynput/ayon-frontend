import { Icon } from '@ynput/ayon-react-components'
import { Expander } from '@containers/Slicer/SlicerTable.styled'
import styled from 'styled-components'
import clsx from 'clsx'
import { useEntitySelection } from '../context/EntitySelectionContext'

const StyledEntityNameWidget = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  height: 100%;
  width: 100%;
`

const StyledContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  padding: 2px 4px;
  border-radius: var(--border-radius-m);
  cursor: pointer;

  &:hover {
    &,
    .icon {
      color: var(--md-sys-color-primary);
    }
  }

  &.selected {
    background-color: var(--md-sys-color-primary);
    &,
    .icon {
      color: var(--md-sys-color-on-primary);
    }

    &:hover {
      background-color: var(--md-sys-color-primary-hover);
    }
  }
`

type EntityNameWidgetProps = {
  id: string
  label: string
  name: string
  icon: string | null
  type: string
  isExpanded: boolean
  toggleExpanderHandler: (e: React.MouseEvent, id: string) => void
  toggleExpanded: () => void
}

export const EntityNameWidget = ({
  id,
  label,
  name,
  icon,
  type,
  isExpanded,
  toggleExpanderHandler,
  toggleExpanded,
}: EntityNameWidgetProps) => {
  const { isSelected, toggleSelection } = useEntitySelection()

  return (
    <StyledEntityNameWidget>
      {type === 'folder' ? (
        <Expander
          onClick={(e) => {
            e.stopPropagation()
            toggleExpanderHandler(e, id)
            toggleExpanded()
          }}
          icon={isExpanded ? 'expand_more' : 'chevron_right'}
        />
      ) : (
        <div style={{ display: 'inline-block', minWidth: 24 }} />
      )}
      <StyledContent
        onClick={(e) => {
          e.stopPropagation()
          // Use metaKey (Command on Mac) or ctrlKey (Ctrl on Windows/Linux)
          const isAdditive = e.metaKey || e.ctrlKey
          toggleSelection(id, type, isAdditive)
        }}
        className={clsx('name-content', { selected: isSelected(id) })}
      >
        {icon && <Icon icon={icon} />}
        <span className="label">{label || name}</span>
      </StyledContent>
    </StyledEntityNameWidget>
  )
}
