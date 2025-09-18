import { InputText } from '@ynput/ayon-react-components'
import React, { KeyboardEvent, useState } from 'react'
import styled from 'styled-components'
import { EntityForm } from '@context/NewEntityContext.tsx'

export const InputLabel = styled.label`
  font-size: 12px;
  color: var(--md-sys-color-outline);
`
const NameDisplay = styled.span`
  color: var(--md-sys-color-outline);
  font-style: italic;
  font-size: 12px;
`

export const InputsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--base-gap-small);
  margin-bottom: var(--base-gap-large);
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
  const [writable, setWritable] = useState(false)

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
      <InputLabel>Name</InputLabel>
      {!writable ? (
        <NameDisplay onClick={() => setWritable(true)}>{entityForm.name}</NameDisplay>
      ) : (
        <InputText
          value={entityForm.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange(e.target.value, 'name')
          }
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
            handleKeyDown(e as unknown as KeyboardEvent, true)
          }
          onBlur={() => setWritable(false)}
          style={{ flex: 1 }}
        />
      )}
    </InputsContainer>
  )
}
export default NewEntityForm
