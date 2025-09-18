import TypeEditor from '@components/NewEntity/TypeEditor.tsx'
import { InputText } from '@ynput/ayon-react-components'
import React, { KeyboardEvent } from 'react'
import Typography from '@/theme/typography.module.css'
import styled from 'styled-components'
import { EntityForm } from '@context/NewEntityContext.tsx'

const ContentStyled = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--base-gap-large);
  form {
    input:first-child {
      margin-right: 8px;
    }
  }
`

const InputLabel = styled.label`
  font-size: 12px;
  color: var(--md-sys-color-outline);
`
const InputsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--base-gap-small);
  margin-bottom: var(--base-gap-large);
`

type NewEntityFormProps = {
  handleChange: (value: any, id?: keyof EntityForm) => void
  entityForm: any
  typeOptions: any
  typeSelectRef: any
  labelRef: any
  setNameFocused: (focused: boolean) => void
  handleTypeSelectFocus: () => void
  handleKeyDown: (e: KeyboardEvent, isLabel: boolean) => void
}

const NewEntityForm: React.FC<NewEntityFormProps> = ({
  handleChange,
  entityForm,
  typeOptions,
  setNameFocused,
  handleTypeSelectFocus,
  typeSelectRef,
  handleKeyDown,
  labelRef,
}) => {
  return (
    <ContentStyled>
      <InputsContainer>
        <InputLabel>Type</InputLabel>
        <TypeEditor
          value={[entityForm.subType]}
          onChange={(v: string) => handleChange(v, 'subType')}
          options={typeOptions}
          style={{ width: 160 }}
          ref={typeSelectRef}
          onFocus={handleTypeSelectFocus}
          onClick={() => setNameFocused(false)}
        />
      </InputsContainer>
      <InputsContainer>
        <InputLabel>Label</InputLabel>
        <InputText
          value={entityForm.label}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange(e.target.value, 'label')
          }
          ref={labelRef}
          onFocus={() => setNameFocused(true)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
            handleKeyDown(e as unknown as KeyboardEvent, true)
          }
          style={{ flex: 1 }}
        />
        <InputLabel>Name</InputLabel>
        <span className={Typography.titleSmall}>{entityForm.name}</span>
      </InputsContainer>
    </ContentStyled>
  )
}
export default NewEntityForm
