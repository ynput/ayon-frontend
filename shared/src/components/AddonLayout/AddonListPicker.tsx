// The host's ListPicker (@ynput/ayon-addon): AYON's ListPickerDialog, which brings the project's
// context where the page has none, with EntityListRefs out. Registered with provideHost by the app
// and the dev shell.
import type { ListPickerProps } from '@ynput/ayon-addon'
import { ListPickerDialog } from '@shared/containers/ListPicker'

export const AddonListPicker = ({
  projectName,
  entityListTypes,
  multiSelect,
  initialSelection,
  onSubmit,
  onClose,
}: ListPickerProps) => (
  <ListPickerDialog
    projectName={projectName}
    entityListTypes={entityListTypes}
    multiSelect={multiSelect}
    initialSelection={initialSelection?.map((list) => list.id)}
    onClose={onClose}
    onSubmit={(lists) =>
      onSubmit(
        lists.map((list) => ({
          id: list.id,
          projectName,
          label: list.label,
          entityListType: list.entityListType,
          entityType: list.entityType,
          count: list.count,
        })),
      )
    }
  />
)
