import { Button, Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { FC } from 'react'
import styled from 'styled-components'

export interface ColumnItemData {
  label: string
  value: string
  icon?: string
}

interface ColumnItemProps {
  column: ColumnItemData
  isPinned: boolean
  isHidden: boolean
  dragHandleProps?: any
  dragOverlay?: boolean
  onTogglePinning?: (columnId: string) => void
  onToggleVisibility?: (columnId: string) => void
}

const ColumnItem: FC<ColumnItemProps> = ({
  column,
  isPinned,
  isHidden,
  // Dragging props
  dragHandleProps,
  dragOverlay = false,
  // Callbacks
  onTogglePinning,
  onToggleVisibility,
}) => {
  return (
    <Item className={clsx({ hidden: isHidden, overlay: dragOverlay })}>
      <div {...dragHandleProps} className={'drag-handle'}>
        <Icon icon="drag_indicator" />
      </div>
      {column.icon && <Icon icon={column.icon} />}
      <span>{column.label}</span>
      <Actions>
        <ActionButton
          onClick={() => onTogglePinning?.(column.value)}
          className={clsx({ active: isPinned })}
        >
          <Icon icon="push_pin" />
        </ActionButton>
        <ActionButton onClick={() => onToggleVisibility?.(column.value)}>
          <Icon icon={isHidden ? 'visibility_off' : 'check'} />
        </ActionButton>
      </Actions>
    </Item>
  )
}

const Item = styled.li`
  display: flex;
  padding: 2px;
  padding-left: 8px;
  height: 32px;
  justify-content: space-between;
  align-items: center;
  gap: var(--base-gap-large);
  cursor: pointer;
  border-radius: 4px;
  cursor: default;
  user-select: none;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high);

    .pin-action {
      opacity: 1;
    }
  }

  .drag-handle {
    cursor: grab;
  }

  &.overlay {
    box-shadow: 0 0 4px 1px rgba(0, 0, 0, 0.1);
  }

  &.dragging {
    opacity: 0;

    .drag-handle {
      cursor: grabbing;
    }
  }
`

const Actions = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  margin-left: auto;
`

const ActionButton = styled(Button)`
  background-color: unset;
  padding: 4px;

  &.active {
    .icon {
      font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 10;
    }
  }

  &.pin-action {
    opacity: 0;
  }

  &.active {
    opacity: 1;
  }
`

export default ColumnItem
