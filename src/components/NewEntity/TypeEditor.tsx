import { FolderType, TaskType } from '@shared/api'
import { Dropdown, DropdownRef } from '@ynput/ayon-react-components'
import { forwardRef, CSSProperties } from 'react'
import { ComponentProps } from '@/types'

interface TypeEditorProps extends ComponentProps {
  value: string
  options: (FolderType | TaskType)[]
  onChange: (value: string) => void
  style?: CSSProperties
  mainStyle?: CSSProperties
  disabled?: boolean
  placeholder?: string
  isChanged?: boolean
  align?: string
  type: string
}

const TypeEditor = forwardRef<DropdownRef, TypeEditorProps>(
  (
    {
      value,
      options,
      onChange,
      style,
      mainStyle,
      disabled,
      placeholder,
      isChanged,
      align,
      type,
      ...props
    },
    ref,
  ) => {
    return (
      <Dropdown
        options={options}
        dataKey="name"
        value={value}
        valueStyle={style}
        onChange={(v: string[]) => onChange(v[0])}
        disabled={disabled}
        isChanged={isChanged}
        placeholder={placeholder}
        valueIcon={options[value]?.icon}
        widthExpand
        search
        searchFields={['name']}
        emptyMessage="None Set"
        style={mainStyle}
        align={align}
        ref={ref}
        {...props}
      />
    )
  },
)

TypeEditor.displayName = 'TypeEditor'

export default TypeEditor
