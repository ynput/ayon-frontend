import { FC, useRef, useCallback } from 'react'
import { InputText, Dropdown, DropdownRef } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import * as EnumStyled from '@shared/components/EnumEditor/EnumEditor.styled'

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const FormRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 40px;
`

const Label = styled.label`
  min-width: 80px;
  font-size: 14px;
  color: var(--md-sys-color-on-surface);
  user-select: none;
`

const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
`

export interface ListFolderFormData {
  label: string
  icon?: string
  color?: string
  scope?: string[]
}

interface ListFolderFormProps {
  data: ListFolderFormData
  onChange: (field: keyof ListFolderFormData, value: string | string[] | undefined) => void
  autoFocus?: boolean
}

const SCOPE_OPTIONS = [
  { value: 'generic', label: 'Generic' },
  { value: 'review-session', label: 'Review Session' },
]

export const ListFolderForm: FC<ListFolderFormProps> = ({ data, onChange, autoFocus = false }) => {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const iconDropdownRef = useRef<DropdownRef>(null)

  const handleColorClick = () => {
    colorInputRef.current?.click()
  }

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange('color', event.target.value)
  }

  const handleColorClear = () => {
    onChange('color', undefined)
  }

  const handleIconClear = () => {
    onChange('icon', undefined)
  }

  const handleScopeChange = useCallback(
    (added: string[]) => {
      onChange('scope', added)
    },
    [onChange],
  )

  return (
    <FormContainer>
      <FormRow>
        <Label>Label</Label>
        <InputWrapper>
          <InputText
            value={data.label}
            onChange={(e) => onChange('label', e.target.value)}
            placeholder="Enter folder label"
            autoFocus={autoFocus}
            style={{ flex: 1 }}
          />
        </InputWrapper>
      </FormRow>

      <FormRow>
        <Label>Icon</Label>
        <InputWrapper>
          <EnumStyled.PlaceholderWrapper style={{ position: 'relative' }}>
            <EnumStyled.Placeholder
              style={{ display: data.icon ? 'none' : 'flex' }}
              onClick={() => {
                iconDropdownRef.current?.open()
              }}
            >
              Pick an icon...
            </EnumStyled.Placeholder>

            <EnumStyled.IconSelect
              ref={iconDropdownRef}
              value={[data.icon || 'question_mark']}
              widthExpand
              style={{
                position: data.icon ? 'relative' : 'absolute',
                visibility: data.icon ? 'visible' : 'hidden',
              }}
              onChange={(value) => {
                onChange('icon', value[0] || undefined)
              }}
            />
            {data.icon && (
              <EnumStyled.Button icon="close" variant="text" onClick={handleIconClear} />
            )}
          </EnumStyled.PlaceholderWrapper>
        </InputWrapper>
      </FormRow>

      <FormRow>
        <Label>Color</Label>
        <InputWrapper>
          <EnumStyled.PlaceholderWrapper style={{ position: 'relative' }}>
            <EnumStyled.ColorPicker
              className={data.color ? 'active' : ''}
              style={{ backgroundColor: data.color || undefined }}
              onClick={handleColorClick}
            >
              {!data.color ? 'Pick a color...' : ''}
              <input
                type="color"
                ref={colorInputRef}
                value={data.color || '#000000'}
                onChange={handleColorChange}
              />
            </EnumStyled.ColorPicker>
            {data.color && (
              <EnumStyled.Button icon="close" variant="text" onClick={handleColorClear} />
            )}
          </EnumStyled.PlaceholderWrapper>
        </InputWrapper>
      </FormRow>

      <FormRow>
        <Label>Scope</Label>
        <InputWrapper>
          <Dropdown
            value={data.scope || []}
            options={SCOPE_OPTIONS}
            onChange={handleScopeChange}
            placeholder="Select scope"
            multiSelect
            widthExpand
            minSelected={1}
            style={{ flex: 1 }}
            dataKey="value"
            labelKey="label"
          />
        </InputWrapper>
      </FormRow>
    </FormContainer>
  )
}

export default ListFolderForm
