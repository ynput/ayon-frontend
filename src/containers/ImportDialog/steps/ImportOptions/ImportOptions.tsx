import { Button } from '@ynput/ayon-react-components'
import { PowerpackButton } from '@shared/components'
import { DuplicateItemStrategy } from '@shared/api/generated/dataImport'
import { ImportContext } from '../common'
import {
  describeDuplicateStrategy,
  describeImportMode,
  describeNewList,
  describeRowsEntityType,
  getDuplicateStrategyOptions,
  hasDuplicateStrategy,
  ImportMode,
  importModeOptions,
  LIST_VALUES_ON_ENTITIES,
  NewListEntityType,
  newListEntityTypeOptions,
  RowsEntityType,
  rowsEntityTypeOptions,
} from '../importMode'
import {
  NewListLabel,
  OptionButtons,
  OptionDescription,
  OptionLabel,
  Options,
} from './ImportOptions.styled'

type NewList = { label: string; entityType: NewListEntityType }

type Props = {
  importContext: ImportContext
  importMode: ImportMode
  onImportModeChange: (importMode: ImportMode) => void
  // set when the import creates a new list, which can only get new items
  newList?: NewList
  // list imports set the values on the entities (no powerpack)
  listValuesOnEntities: boolean
  onNewListChange: (newList: NewList) => void
  rowsEntityType: RowsEntityType
  onRowsEntityTypeChange: (rowsEntityType: RowsEntityType) => void
  duplicateStrategy: DuplicateItemStrategy
  onDuplicateStrategyChange: (duplicateStrategy: DuplicateItemStrategy) => void
}

export default function ImportOptions({
  importContext,
  importMode,
  onImportModeChange,
  newList,
  listValuesOnEntities,
  onNewListChange,
  rowsEntityType,
  onRowsEntityTypeChange,
  duplicateStrategy,
  onDuplicateStrategyChange,
}: Props) {
  return (
    <Options>
      {newList ? (
        <>
          <OptionLabel>New list</OptionLabel>
          <NewListLabel
            value={newList.label}
            placeholder="List name"
            onChange={(event) => onNewListChange({ ...newList, label: event.target.value })}
          />
          <OptionDescription>{describeNewList(newList.entityType)}</OptionDescription>

          <OptionLabel>List of</OptionLabel>
          <OptionButtons>
            {newListEntityTypeOptions.map(({ value, label, icon }) => (
              <Button
                key={value}
                icon={icon}
                label={label}
                selected={newList.entityType === value}
                onClick={() => onNewListChange({ ...newList, entityType: value })}
              />
            ))}
          </OptionButtons>
          <span />
        </>
      ) : (
        <>
          <OptionLabel>Import</OptionLabel>
          <OptionButtons>
            {importModeOptions.map(({ value, label, icon }) => (
              <Button
                key={value}
                icon={icon}
                label={label}
                selected={importMode === value}
                onClick={() => onImportModeChange(value)}
              />
            ))}
          </OptionButtons>
          <OptionDescription>
            {describeImportMode(importContext, importMode, listValuesOnEntities)}
          </OptionDescription>
        </>
      )}

      {importContext === 'entity_list_item' && listValuesOnEntities && (
        <>
          <OptionLabel>Values</OptionLabel>
          <OptionButtons>
            <PowerpackButton feature="listValues" icon="list" label="List values" bolt />
          </OptionButtons>
          <OptionDescription>{LIST_VALUES_ON_ENTITIES}</OptionDescription>
        </>
      )}

      {importContext === 'hierarchy' && (
        <>
          <OptionLabel>Entity type</OptionLabel>
          <OptionButtons>
            {rowsEntityTypeOptions.map(({ value, label, icon }) => (
              <Button
                key={value}
                icon={icon}
                label={label}
                selected={rowsEntityType === value}
                onClick={() => onRowsEntityTypeChange(value)}
              />
            ))}
          </OptionButtons>
          <OptionDescription>
            {describeRowsEntityType(rowsEntityType, importMode)}
          </OptionDescription>
        </>
      )}

      {hasDuplicateStrategy(importContext, importMode) && (
        <>
          <OptionLabel>Same name</OptionLabel>
          <OptionButtons>
            {getDuplicateStrategyOptions(importContext).map(({ value, label, icon }) => (
              <Button
                key={value}
                icon={icon}
                label={label}
                selected={duplicateStrategy === value}
                onClick={() => onDuplicateStrategyChange(value)}
              />
            ))}
          </OptionButtons>
          <OptionDescription>{describeDuplicateStrategy(importContext)}</OptionDescription>
        </>
      )}
    </Options>
  )
}
