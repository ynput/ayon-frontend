import { DefaultValueTemplate, Dropdown } from '@ynput/ayon-react-components'
import { useState } from 'react'
import styled, { css } from 'styled-components'

const StyledDropdown = styled(Dropdown)`
  width: 100%;

  ${({ $isOpen }) =>
    !$isOpen &&
    css`
      .button:not(:hover) {
        background-color: unset;

        & > div {
          border-color: transparent;
        }

        .control {
          opacity: 0;
        }
      }
    `}

  &.changed {
    .button {
      background-color: var(--color-changed);
      color: var(--md-sys-color-on-primary);
    }

    &.inherited {
      font-style: italic;
    }
  }
`

const ToolsField = ({ value, className, attrib }) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!value || !value.length) console.log('null')

  const _enum = attrib?.enum

  const labels = _enum
    ?.filter((item) => value.includes(item.value))
    .map((item) => item.label || item.value)

  const isInheritedAndChanged = className.includes('inherited') && className.includes('changed')

  return (
    <StyledDropdown
      disabled={isInheritedAndChanged}
      value={labels}
      className={className}
      multiSelect
      itemStyle={{ pointerEvents: 'none', backgroundColor: 'unset' }}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      valueTemplate={() => (
        <DefaultValueTemplate value={value}>
          {isInheritedAndChanged ? '(inherited)' : `(${labels.length}) ${labels.join(', ')}`}
        </DefaultValueTemplate>
      )}
      $isOpen={isOpen}
    />
  )
}

export default ToolsField
