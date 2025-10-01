import { InputText } from '@ynput/ayon-react-components'
import React, { KeyboardEvent, useState, useRef } from 'react'
import styled from 'styled-components'
import { EntityForm } from '@context/NewEntityContext.tsx'
import { theme } from '@ynput/ayon-react-components'
import { Icon } from '@ynput/ayon-react-components'

export const InputLabel = styled.label`
  font-size: ${theme.labelMedium};
  color: var(--md-sys-color-outline);
`
const NameDisplay = styled.span`
  position: relative;
  padding: 2px 6px;
  font-size: ${theme.bodySmall};
  display: inline-flex;
  min-height: 20px;
  gap: var(--base-gap-small);
  cursor: pointer;

  .icon {
    display: none;
    font-size: 14px;
  }
  &:hover {
    background-color: var(--md-sys-color-surface-container-low);
    border-radius: var(--border-radius-m);
    .icon {
      display: flex;
    }
  }
`

const NameInput = styled(InputText)`
  font-size: ${theme.bodySmall};
  width: 100px;
  max-width: 160px;
  min-height: 0;
  height: 20px;
  border: 0;
  padding: 1px 6px;

  input {
    color: var(--md-sys-color-outline);
    outline: none;

    &:focus {
      background: var(--md-sys-color-surface-container-low);
      border: none;
      outline: 1px solid var(--md-sys-color-primary);
    }
  }
`

export const InputsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--base-gap-small);
  margin-bottom: calc(var(--base-gap-large) - 16px);

  label {
    white-space: nowrap;
  }

  [icon='info'] {
    cursor: help;
    font-size: 16px;
    color: var(--md-sys-color-outline);
  }
`

export const NameRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 6px;
  gap: var(--base-gap-small);
  width: 100%;
  word-break: break-all;
`

type NewEntityFormProps = {
  handleChange: (value: any, id?: keyof EntityForm) => void
  entityForm: any
  labelRef: any
  setNameFocused: (focused: boolean) => void
  handleKeyDown: (e: KeyboardEvent, isLabel: boolean) => void
  nameInfo?: string
}

const NewEntityForm: React.FC<NewEntityFormProps> = ({
  handleChange,
  entityForm,
  setNameFocused,
  handleKeyDown,
  labelRef,
  nameInfo = '',
}) => {
  const [nameInputFocused, setNameInputFocused] = useState(false)
  const [originalName, setOriginalName] = useState<string | undefined>(undefined)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleNameDisplayClick = () => {
    setNameInputFocused(true)
    setNameFocused(true)
    setOriginalName(entityForm.name) // Store original name before editing
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus()
        nameInputRef.current.select()
      }
    }, 0)
  }

  const handleNameInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check if the click target is outside the input
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !nameInputRef.current?.contains(relatedTarget)) {
      setNameInputFocused(false)
      setNameFocused(false)
      setOriginalName(undefined) // Clear original name on blur
    }
  }

  const handleLabelKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // navigate down to name input using the down arrow or tab
    if ((e.key === 'ArrowDown' && !e.altKey) || e.key === 'Tab') {
      e.preventDefault()
      handleNameDisplayClick()
      return
    }

    // submit the form on enter
    handleKeyDown(e as unknown as KeyboardEvent, true)
  }

  const handleNameKeydown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape' || (e.key === 'ArrowUp' && !e.altKey)) {
      // prevent propagation to avoid closing the dialog
      e.stopPropagation()

      // of closed then open
      if (e.key === 'Enter' && !nameInputFocused) {
        return handleNameDisplayClick()
      }

      // If Escape, revert to original name
      if (e.key === 'Escape') {
        if (originalName !== undefined) {
          handleChange(originalName, 'name')
        }
      }

      // close the input
      setNameInputFocused(false)
      setNameFocused(false)
      setOriginalName(undefined)

      setTimeout(() => {
        // focus back to label input
        labelRef.current?.focus()
        // selection at the end of the input
        const length = entityForm.label.length || 0
        labelRef.current?.setSelectionRange(length, length)
      }, 0)

      return
    }
  }

  return (
    <InputsContainer>
      <InputLabel>Label</InputLabel>
      <InputText
        value={entityForm.label}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, 'label')}
        ref={labelRef}
        onFocus={() => setNameFocused(true)}
        onKeyDown={handleLabelKeydown}
        style={{ flex: 1 }}
      />
      <NameRow onKeyDown={handleNameKeydown}>
        <InputLabel>Name</InputLabel>
        {nameInfo && <Icon icon="info" data-tooltip={nameInfo} data-tooltip-delay={0} />}
        {!nameInputFocused ? (
          <NameDisplay onClick={handleNameDisplayClick} tabIndex={0}>
            {entityForm.name} <Icon icon="edit" />
          </NameDisplay>
        ) : (
          <NameInput
            ref={nameInputRef}
            value={entityForm.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange(e.target.value, 'name')
            }
            onBlur={handleNameInputBlur}
            style={{ flex: 1 }}
          />
        )}
      </NameRow>
    </InputsContainer>
  )
}
export default NewEntityForm
