// The host's EntityPicker (@ynput/ayon-addon): AYON's EntityPickerDialog, which brings the project's
// providers where the page has none, with EntityRefs in and out. Registered with provideHost by the
// app and the dev shell.
import type { EntityPickerProps } from '@ynput/ayon-addon'
import { EntityPickerDialog } from '@shared/containers/EntityPickerDialog'
import { toEntityRefs, toPickerSelection } from './AddonEntityPickerHelpers'

export const AddonEntityPicker = ({
  projectName,
  entityType,
  multiSelect,
  initialSelection,
  onSubmit,
  onClose,
}: EntityPickerProps) => (
  <EntityPickerDialog
    projectName={projectName}
    entityType={entityType}
    isMultiSelect={multiSelect}
    // read once, when the picker opens
    initialSelection={toPickerSelection(initialSelection)}
    onClose={onClose}
    onSubmit={(ids, entities) => onSubmit(toEntityRefs(ids, entities, entityType, projectName))}
  />
)
