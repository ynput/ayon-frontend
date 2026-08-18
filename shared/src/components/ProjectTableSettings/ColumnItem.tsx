import clsx from 'clsx'
import { FC, useMemo } from 'react'
import {
  SettingsPanelItemTemplate,
  SettingsPanelItem,
} from '../SettingsPanel/SettingsPanelItemTemplate'
import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const SettingsPanelItemTemplateStyled = styled(SettingsPanelItemTemplate)`
  &:hover {
    .pin-action {
      opacity: 1;
    }
  }

  .drag-handle {
    cursor: grab;
    height: 20px;
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

  &.hidden {
    .pin-action {
      opacity: 0;
    }
  }
`

interface ColumnItemProps {
  id?: string
  column: SettingsPanelItem
  isPinned: boolean
  isHidden: boolean
  isHighlighted?: boolean
  isDisabled?: boolean
  dragHandleProps?: any
  dragOverlay?: boolean
  hideDragHandle?: boolean
  onTogglePinning?: (columnId: string) => void
  onToggleVisibility?: (columnId: string) => void
  onPaintStart?: (columnId: string) => void
  onPaintEnter?: (columnId: string, pressed: boolean) => void
}

const ColumnItem: FC<ColumnItemProps> = ({
  id,
  column,
  isPinned,
  isHidden,
  isHighlighted,
  isDisabled,
  // Dragging props
  dragHandleProps,
  dragOverlay = false,
  hideDragHandle = false,
  // Callbacks
  onTogglePinning,
  onToggleVisibility,
  onPaintStart,
  onPaintEnter,
}) => {
  const itemActions = useMemo(
    () => [
      {
        icon: 'push_pin',
        onClick: () => onTogglePinning?.(column.value),
        active: isPinned,
        className: 'pin-action',
      },
      {
        icon: isHidden ? 'visibility_off' : 'visibility',
        onClick: () => onToggleVisibility?.(column.value),
        // arms a paint drag, the toggle itself still happens on click
        onPointerDown: isDisabled ? undefined : () => onPaintStart?.(column.value),
        active: !isHidden,
      },
    ],
    [
      isPinned,
      isHidden,
      isDisabled,
      column.value,
      onTogglePinning,
      onToggleVisibility,
      onPaintStart,
    ],
  )

  return (
    <SettingsPanelItemTemplateStyled
      id={id}
      item={column}
      actions={itemActions}
      isHighlighted={isHighlighted}
      isDisabled={isDisabled}
      className={clsx({ hidden: isHidden, overlay: dragOverlay })}
      onPointerEnter={(event) => onPaintEnter?.(column.value, event.buttons > 0)}
      startContent={
        hideDragHandle ? undefined : (
          <div {...dragHandleProps} className="drag-handle">
            <Icon icon="drag_indicator" />
          </div>
        )
      }
    />
  )
}

export default ColumnItem
