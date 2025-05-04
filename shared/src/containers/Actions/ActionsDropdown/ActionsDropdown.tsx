import { DefaultValueTemplate, Button, Spacer, DropdownRef } from '@ynput/ayon-react-components'
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
  icon: IconModel
  header?: boolean
  hasConfig?: boolean
  onConfig?: (value: string) => void
}

export const ActionsDropdownItem = ({
  value,
  label,
  icon,
  header,
  hasConfig,
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
      <ActionItemContainer>
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

export type ActionsDropdownProps = {
  options: ActionsDropdownItemProps[]
  isLoading?: boolean
  onAction: (value: string) => void
  onConfig: (e: any) => void
}

export const ActionsDropdown = ({
  options,
  isLoading,
  onAction,
  onConfig,
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
      className={clsx('more', { loading: isLoading })}
      options={options}
      maxOptionsShown={100}
      value={[]}
      placeholder=""
      itemTemplate={(option) => <ActionsDropdownItem {...option} onConfig={handleConfigClick} />}
      valueTemplate={() => <DefaultValueTemplate placeholder="" value={[]} />}
      onChange={(v) => onAction(v[0])}
      // @ts-expect-error
      buttonProps={{ ['data-tooltip']: 'All actions' }}
    />
  )
}
