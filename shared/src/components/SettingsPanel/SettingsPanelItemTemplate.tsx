import { Button, ButtonProps, Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef } from 'react'
import styled from 'styled-components'

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
  overflow: hidden;

  .label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.highlighted {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);

    &:hover {
      background-color: var(--md-sys-color-secondary-container-hover);
    }
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-high);
  }

  &.disabled {
    opacity: 0.5;
    user-select: none;
    pointer-events: none;
    &:hover {
      background-color: unset;
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

  &.active {
    opacity: 1;
  }
`

interface Action extends ButtonProps {
  active?: boolean
  ['data-tooltip']?: string
  ['data-shortcut']?: string
}

export type SettingsPanelItem = {
  value: string
  label: string
  icon?: string
}

export interface SettingsPanelItemTemplateProps extends React.HTMLAttributes<HTMLLIElement> {
  item: SettingsPanelItem
  isHighlighted?: boolean
  isDisabled?: boolean
  startContent?: React.ReactNode
  endContent?: React.ReactNode
  actions?: Action[]
}

export const SettingsPanelItemTemplate = forwardRef<HTMLLIElement, SettingsPanelItemTemplateProps>(
  (
    { item, actions, startContent, endContent, isHighlighted, isDisabled, className, ...props },
    ref,
  ) => {
    return (
      <Item
        className={clsx('setting-item', className, {
          highlighted: isHighlighted,
          disabled: isDisabled,
        })}
        {...props}
        ref={ref}
      >
        {startContent}
        {item.icon && <Icon icon={item.icon} />}
        <span className="label">{item.label}</span>
        <Actions className="actions">
          {actions?.map(({ icon, className, active, onClick, ...action }, index) => (
            <ActionButton
              key={index}
              className={clsx('action', className, { active })}
              onClick={!isDisabled ? onClick : undefined}
              {...action}
            >
              {icon && <Icon icon={icon} />}
              {action.children}
            </ActionButton>
          ))}
        </Actions>
        {endContent}
      </Item>
    )
  },
)
