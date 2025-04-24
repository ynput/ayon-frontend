import {
  Button,
  Dialog,
  DialogProps,
  Dropdown,
  InputText,
  SaveButton,
} from '@ynput/ayon-react-components'
import { forwardRef, useEffect, useRef } from 'react'
import type { NewListForm } from '@pages/ProjectListsPage/hooks/useNewList'
import * as Styled from './NewListDialog.styled'
import { getEntityTypeIcon } from '@shared/util'

const options = ['folder', 'product', 'version', 'representation', 'task', 'workfile'].map(
  (type) => ({
    label: type.charAt(0).toUpperCase() + type.slice(1),
    value: type,
    icon: getEntityTypeIcon(type),
  }),
)

interface NewListDialogProps extends Omit<DialogProps, 'onChange'> {
  form?: NewListForm | null
  onChange: (value: NewListForm) => void
  onSubmit?: () => void
  submitLoading?: boolean
  error?: string
}

export const NewListDialog = forwardRef<HTMLDivElement, NewListDialogProps>(
  (
    {
      form = { label: '', entityListType: 'generic', entityType: 'folder', access: {} },
      onChange,
      onSubmit,
      submitLoading,
      error,
      ...props
    },
    ref,
  ) => {
    // new: ref for input
    const inputRef = useRef<HTMLInputElement>(null)
    // new: focus and select on mount
    useEffect(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, [])

    if (!form) return null
    const handleChange = <K extends keyof NewListForm>(value: NewListForm[K], field: K) => {
      onChange({
        ...form,
        [field]: value,
      })
    }

    console.log(form.entityType)

    return (
      <Dialog
        {...props}
        ref={ref}
        size="sm"
        header="Create New List"
        footer={
          <Styled.Footer>
            <Button label="Cancel" variant="text" icon="close" onClick={props.onClose} />
            <SaveButton
              label="Create list"
              icon="add"
              onClick={onSubmit}
              disabled={!form.label || submitLoading}
              saving={submitLoading}
            />
          </Styled.Footer>
        }
      >
        <Styled.Form
          onSubmit={(e) => {
            e.preventDefault()
            if (
              e.nativeEvent instanceof KeyboardEvent &&
              (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey) &&
              e.nativeEvent.key === 'Enter'
            ) {
              onSubmit?.()
            }
          }}
        >
          <Styled.Row>
            <label htmlFor="label">List label</label>
            <InputText
              ref={inputRef} // new: attach ref
              type="text"
              id="label"
              name="label"
              value={form.label}
              required
              onChange={(e) => handleChange(e.target.value, 'label')}
              autoFocus
              onFocus={(e) => e.target.select()}
              autoComplete="off"
            />
          </Styled.Row>
          <Styled.Row>
            <label htmlFor="entityType">Entity type</label>
            <Dropdown
              value={[form.entityType]}
              onChange={(e) => handleChange(e[0] as NewListForm['entityType'], 'entityType')}
              options={options}
              valueIcon={getEntityTypeIcon(form.entityType)}
            />
          </Styled.Row>
        </Styled.Form>
      </Dialog>
    )
  },
)
