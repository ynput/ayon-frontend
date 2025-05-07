import { DefaultValueTemplate, Button, Spacer } from '@ynput/ayon-react-components'
import { DropdownHeader, DropdownItem, StyledDropdown } from './ActionsDropdown.styled'
import clsx from 'clsx'
import { useRef } from 'react'
import { upperFirst } from 'lodash'
import ActionIcon from '@/containers/Actions/ActionIcon'
import styled from 'styled-components'

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

export const ActionsDropdownItem = ({ value, label, icon, header, hasConfig, onConfig }) => {
  if (header) return <DropdownHeader>{upperFirst(label)}</DropdownHeader>

  const handleConfig = (e) => {
    onConfig(value)
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

const ActionsDropdown = ({ options, isLoading, onAction, onConfig }) => {
  const dropdownRef = useRef(null)

  const handleConfigClick = (e) => {
    dropdownRef.current.close()
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
      valueTemplate={() => <DefaultValueTemplate placeholder="" />}
      onChange={(v) => onAction(v[0])}
      buttonProps={{ ['data-tooltip']: 'All actions' }}
      searchFields={['label']}
    />
  )
}

export default ActionsDropdown
