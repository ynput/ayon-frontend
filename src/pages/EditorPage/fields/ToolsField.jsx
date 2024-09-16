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

  &.inherited {
    font-style: italic;
    color: var(--md-ref-palette-neutral-variant60);
  }

  &.changed {
    .button {
      background-color: var(--color-changed);
      color: var(--md-sys-color-on-primary);
    }
  }
`

const ToolsField = ({ value, className, attrib }) => {
  const [isOpen, setIsOpen] = useState(false)

  const _enum = attrib?.enum

  const labels = _enum
    ?.filter((item) => value.includes(item.value))
    .map((item) => item.label || item.value)

  const isInheritedAndChanged = className.includes('inherited') && className.includes('changed')

  if (isInheritedAndChanged) {
    // TODO come back here
    return <span className="editor-field changed">(inherited)</span>
  }

  if (!value?.length) return null

  return (
    <StyledDropdown
      value={labels}
      options={labels.map((label) => ({ label, value: label }))}
      className={className}
      itemStyle={{ pointerEvents: 'none', backgroundColor: 'unset' }}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      onDoubleClick={(e) => e.stopPropagation()}
      valueTemplate={() => (
        <DefaultValueTemplate value={value}>
          {!labels.length ? 'None' : `(${labels?.length}) ${labels?.join(', ')}`}
        </DefaultValueTemplate>
      )}
      $isOpen={isOpen}
    />
  )
}

export default ToolsField
