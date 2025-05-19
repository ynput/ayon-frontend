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
import { Error } from '@containers/ReleaseInstallerDialog/ReleaseInstaller.styled'

export const listEntityTypes = ['folder', 'version', 'task'] as const
export type ListEntityType = (typeof listEntityTypes)[number]

export const entityTypeOptions = listEntityTypes.map((type) => ({
  label: type.charAt(0).toUpperCase() + type.slice(1),
  value: type,
  icon: getEntityTypeIcon(type),
}))

interface NewListDialogProps extends Omit<DialogProps, 'onChange' | 'hidden'> {
  form?: NewListForm | null
  onChange: (value: NewListForm) => void
  onSubmit?: () => void
  submitLoading?: boolean
  error?: string
  hidden?: ('label' | 'entityType')[]
}

export const NewListDialog = forwardRef<HTMLDivElement, NewListDialogProps>(
  (
    {
      form = { label: '', entityListType: 'generic', entityType: 'folder', access: {} },
      onChange,
      onSubmit,
      submitLoading,
      error,
      hidden,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
      if (!form) return
      inputRef.current?.focus()
      inputRef.current?.select()
    }, [!!form])

    if (!form) return null
    const handleChange = <K extends keyof NewListForm>(value: NewListForm[K], field: K) => {
      onChange({
        ...form,
        [field]: value,
      })
    }

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
          }}
          onKeyDown={(e) => {
            if (
              e.nativeEvent instanceof KeyboardEvent &&
              (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey) &&
              e.nativeEvent.key === 'Enter'
            ) {
              onSubmit?.()
            }
          }}
        >
          {!hidden?.includes('label') && (
            <Styled.Row>
              <label htmlFor="label">List label</label>
              <InputText
                ref={inputRef}
                type="text"
                id="label"
                name="label"
                value={form.label}
                required
                onChange={(e) => handleChange(e.target.value, 'label')}
                autoComplete="off"
              />
            </Styled.Row>
          )}
          {!hidden?.includes('entityType') && (
            <Styled.Row>
              <label htmlFor="entityType">Entity type</label>
              <Dropdown
                value={[form.entityType]}
                onChange={(e) => handleChange(e[0] as NewListForm['entityType'], 'entityType')}
                options={entityTypeOptions}
                valueIcon={getEntityTypeIcon(form.entityType)}
              />
            </Styled.Row>
          )}
          {error && <Error>{error}</Error>}
        </Styled.Form>
      </Dialog>
    )
  },
)
