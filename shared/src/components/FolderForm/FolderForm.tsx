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
  padding-top: var(--padding-s);
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
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

export interface FolderFormData {
  label: string
  icon?: string
  color?: string
  scope?: string[]
  parentId?: string
}

export const ALL_SCOPE = '__all__'

interface ScopeConfig {
  options: { value: string; label: string }[]
  filter?: string[]
}

interface FolderFormProps {
  data: FolderFormData
  onChange: (field: keyof FolderFormData, value: string | string[] | undefined) => void
  autoFocus?: boolean
  scopeConfig?: ScopeConfig
}

export const FolderForm: FC<FolderFormProps> = ({
  data,
  onChange,
  autoFocus = false,
  scopeConfig,
}) => {
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
      if (added.includes(ALL_SCOPE)) {
        onChange('scope', [])
        return
      } else {
        onChange('scope', added)
      }
    },
    [onChange],
  )

  const scopeOptions = scopeConfig
    ? [
        ...scopeConfig.options,
        { value: ALL_SCOPE, label: 'All' },
      ].filter((scope) =>
        scopeConfig.filter
          ? scopeConfig.filter.includes(scope.value as any) || scope.value === ALL_SCOPE
          : true,
      )
    : []

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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  iconDropdownRef.current?.open()
                }
              }}
              tabIndex={0}
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

                if (!data.icon) {
                  colorInputRef?.current?.parentElement?.focus()
                }
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleColorClick()
                }
              }}
              tabIndex={0}
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

      {scopeConfig && (
        <FormRow>
          <Label>Scope</Label>
          <InputWrapper>
            <Dropdown
              value={data.scope?.length ? data.scope : [ALL_SCOPE]}
              options={scopeOptions}
              onChange={handleScopeChange}
              placeholder="Select scope"
              widthExpand
              style={{ flex: 1 }}
              dataKey="value"
              labelKey="label"
            />
          </InputWrapper>
        </FormRow>
      )}
    </FormContainer>
  )
}

export default FolderForm
