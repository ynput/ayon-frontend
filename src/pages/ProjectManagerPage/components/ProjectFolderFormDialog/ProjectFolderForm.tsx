import { FC, useRef } from 'react'
import { InputText } from '@ynput/ayon-react-components'
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

export interface ProjectFolderFormData {
  label: string
  icon?: string
  color?: string
  parentId?: string
}

interface ProjectFolderFormProps {
  data: ProjectFolderFormData
  onChange: (field: keyof ProjectFolderFormData, value: string | undefined) => void
  autoFocus?: boolean
}

export const ProjectFolderForm: FC<ProjectFolderFormProps> = ({
  data,
  onChange,
  autoFocus = false,
}) => {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const iconDropdownRef = useRef<any>(null)

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
                  // focus the colour button or input
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
    </FormContainer>
  )
}

export default ProjectFolderForm
