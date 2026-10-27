import { FC, useEffect, useState } from 'react'
import {
  ColorPicker,
  Dialog,
  FormRow,
  IconSelect,
  InputText,
  SaveButton,
} from '@ynput/ayon-react-components'
import styled from 'styled-components'

const DialogBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

export type EnumItemField = 'label' | 'icon' | 'color'

export interface EnumItemDraft {
  value: string
  label?: string
  icon?: string
  color?: string
}

export interface EnumItemDialogProps {
  // the item being edited, or created when isNew; closed when undefined
  item?: EnumItemDraft
  isNew?: boolean
  // what can be changed besides the value, which is only set when the item is created
  fields: EnumItemField[]
  // what the items are, e.g. "tag"
  itemLabel?: string
  onSave: (item: EnumItemDraft) => void
  onCancel: () => void
}

// The item's events stay in the dialog: rendered from a table cell or a dropdown, they would
// otherwise reach their handlers through the React tree, although the dialog is portalled.
const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation()

// creates or edits an item of an enum, e.g. a tag of the project
export const EnumItemDialog: FC<EnumItemDialogProps> = ({
  item,
  isNew,
  fields,
  itemLabel = 'item',
  onSave,
  onCancel,
}) => {
  const [draft, setDraft] = useState<EnumItemDraft>({ value: '' })
  useEffect(() => {
    if (item) setDraft(item)
  }, [item])

  const update = (change: Partial<EnumItemDraft>) => setDraft({ ...draft, ...change })
  const value = draft.value.trim()
  const save = () => value && onSave({ ...draft, value })

  return (
    <div
      style={{ display: 'contents' }}
      onKeyDown={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onClick={stopPropagation}
      onDoubleClick={stopPropagation}
      onContextMenu={stopPropagation}
    >
      <Dialog
        isOpen={!!item}
        onClose={onCancel}
        header={isNew ? `Add ${itemLabel}` : `Edit ${itemLabel} ${item?.value}`}
        size="sm"
        hideCancelButton
        footer={
          <SaveButton label={isNew ? 'Add' : 'Save'} icon="check" onClick={save} active={!!value} />
        }
      >
        <DialogBody>
          {isNew && (
            <FormRow label="Name">
              <InputText
                value={draft.value}
                onChange={(e) => update({ value: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                autoFocus
              />
            </FormRow>
          )}
          {fields.includes('label') && (
            <FormRow label="Label">
              <InputText
                value={draft.label || ''}
                placeholder={draft.value}
                onChange={(e) => update({ label: e.target.value })}
              />
            </FormRow>
          )}
          {fields.includes('icon') && (
            <FormRow label="Icon">
              <IconSelect
                value={draft.icon ? [draft.icon] : []}
                onChange={(icons) => update({ icon: icons[0] })}
              />
            </FormRow>
          )}
          {fields.includes('color') && (
            <FormRow label="Colour">
              <ColorPicker value={draft.color} onChange={(color) => update({ color })} />
            </FormRow>
          )}
        </DialogBody>
      </Dialog>
    </div>
  )
}
