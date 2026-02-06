import { DefaultValueTemplate, Button, Spacer, DropdownRef, DropdownProps } from '@ynput/ayon-react-components'
import { DropdownHeader, DropdownItem, StyledDropdown } from './ActionsDropdown.styled'
import clsx from 'clsx'
import { useRef } from 'react'
import { upperFirst } from 'lodash'
import ActionIcon from '../ActionIcon'
import styled from 'styled-components'
import { IconModel } from '@shared/api'

const ActionItemContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 4px;

  // use visibility instead of display, so dropdown adjusts its width
  button {
    display: flex;
    visibility: hidden;
  }

  &:hover,
  &:focus-within {
    button {
      visibility: visible;
    }
  }
`

type ActionsDropdownItemProps = {
  value: string
  label: string
  icon?: IconModel
  header?: boolean
  hasConfig?: boolean
  description?: string
  onConfig?: (value: string) => void
}

export const ActionsDropdownItem = ({
  value,
  label,
  icon,
  header,
  hasConfig,
  description,
  onConfig,
}: ActionsDropdownItemProps) => {
  if (header) return <DropdownHeader>{upperFirst(label)}</DropdownHeader>

  const handleConfig = (e: any) => {
    onConfig?.(value)
    e.stopPropagation()
    e.preventDefault()
  }

  return (
    <DropdownItem>
      <ActionItemContainer data-tooltip={description || ''} data-tooltip-delay={0}>
        <ActionIcon icon={icon} />
        <span>{label}</span>
        <Spacer />
        {hasConfig && (
          <Button
            onClick={handleConfig}
            icon="settings_applications"
            tabIndex={-1}
            style={{ background: 'none', padding: 0 }}
          />
        )}
      </ActionItemContainer>
    </DropdownItem>
  )
}

export interface ActionsDropdownProps extends Omit<DropdownProps, 'value'> {
  options: ActionsDropdownItemProps[]
  isLoading?: boolean
  isDeveloperMode: boolean
  onAction: (value: string) => void
  onConfig: (e: any) => void
}

export const ActionsDropdown = ({
  options,
  isLoading,
  isDeveloperMode,
  onAction,
  onConfig,
  ...props
}: ActionsDropdownProps) => {
  const dropdownRef = useRef<DropdownRef>(null)

  const handleConfigClick = (e: any) => {
    dropdownRef.current?.close()
    onConfig(e)
  }
  return (
    <StyledDropdown
      ref={dropdownRef}
      disabled={isLoading}
      className={clsx('more', { loading: isLoading, dev: isDeveloperMode })}
      options={options}
      maxOptionsShown={100}
      value={[]}
      placeholder=""
      itemTemplate={(option) => <ActionsDropdownItem {...option} onConfig={handleConfigClick} />}
      valueTemplate={() => <DefaultValueTemplate placeholder="" value={[]} dropIcon={'category'} />}
      onChange={(v) => onAction(v[0])}
      buttonProps={{
        // @ts-expect-error
        ['data-tooltip']: isDeveloperMode ? 'Actions (dev bundle)' : 'Actions',
        ['data-tooltip-delay']: 0,
      }}
      {...props}
    />
  )
}
