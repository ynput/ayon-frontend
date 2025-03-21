import { Button, Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { FC } from 'react'
import styled from 'styled-components'

export type ColumnItemData = {
  value: string
  label: string
}

interface ColumnItemProps {
  column: ColumnItemData
  isPinned: boolean
  isHidden: boolean
  onTogglePinning: (columnId: string) => void
  onToggleVisibility: (columnId: string) => void
}

const ColumnItem: FC<ColumnItemProps> = ({
  column,
  isPinned,
  isHidden,
  onTogglePinning,
  onToggleVisibility,
}) => {
  return (
    <Item key={column.value} onClick={() => onToggleVisibility(column.value)}>
      <span>{column.label}</span>
      <Actions>
        {!isHidden && (
          <ActionButton
            onClick={(e) => {
              e.stopPropagation()
              onTogglePinning(column.value)
            }}
            className={clsx('pin-action', { active: isPinned })}
            disabled={isHidden}
          >
            <Icon icon="push_pin" />
          </ActionButton>
        )}
        <ActionButton className={clsx('visibility-action', { active: !isHidden })}>
          <Icon icon={isHidden ? 'visibility_off' : 'visibility'} />
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
