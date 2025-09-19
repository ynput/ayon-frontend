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
  padding: 2px 6px; // <- changed
  font-size: ${theme.bodySmall};
  display: inline-flex;
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
`

export const NameRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 6px;
  gap: var(--base-gap-small);
  width: 100%;
`

type NewEntityFormProps = {
  handleChange: (value: any, id?: keyof EntityForm) => void
  entityForm: any
  labelRef: any
  setNameFocused: (focused: boolean) => void
  handleKeyDown: (e: KeyboardEvent, isLabel: boolean) => void
}

const NewEntityForm: React.FC<NewEntityFormProps> = ({
  handleChange,
  entityForm,
  setNameFocused,
  handleKeyDown,
  labelRef,
}) => {
  const [nameInputFocused, setNameInputFocused] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleNameDisplayClick = () => {
    setNameInputFocused(true)
    setNameFocused(true)
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
    }
  }
  console.log('input focused', nameInputFocused)

  return (
    <InputsContainer>
      <InputLabel>Label</InputLabel>
      <InputText
        value={entityForm.label}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, 'label')}
        ref={labelRef}
        onFocus={() => setNameFocused(true)}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
          handleKeyDown(e as unknown as KeyboardEvent, true)
        }
        style={{ flex: 1 }}
      />
      <NameRow>
        <InputLabel>Name</InputLabel>
        {!nameInputFocused ? (
          <NameDisplay onClick={handleNameDisplayClick}>
            {entityForm.name} <Icon icon="edit" />
          </NameDisplay>
        ) : (
          <NameInput
            ref={nameInputRef}
            value={entityForm.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange(e.target.value, 'name')
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              handleKeyDown(e as unknown as KeyboardEvent, true)
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
