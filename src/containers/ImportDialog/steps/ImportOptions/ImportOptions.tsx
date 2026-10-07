import { Button } from '@ynput/ayon-react-components'
import { DuplicateItemStrategy } from '@shared/api/generated/dataImport'
import { ImportContext } from '../common'
import {
  describeDuplicateStrategy,
  describeImportMode,
  describeListValues,
  describeNewList,
  describeRowsEntityType,
  getDuplicateStrategyOptions,
  hasDuplicateStrategy,
  ImportMode,
  importModeOptions,
  listValuesOptions,
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
  onNewListChange: (newList: NewList) => void
  updateListedEntities: boolean
  onUpdateListedEntitiesChange: (updateListedEntities: boolean) => void
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
  onNewListChange,
  updateListedEntities,
  onUpdateListedEntitiesChange,
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
          <OptionDescription>{describeImportMode(importContext, importMode)}</OptionDescription>
        </>
      )}

      {importContext === 'entity_list_item' && (
        <>
          <OptionLabel>Values</OptionLabel>
          <OptionButtons>
            {listValuesOptions.map(({ value, label, icon }) => (
              <Button
                key={label}
                icon={icon}
                label={label}
                selected={updateListedEntities === value}
                onClick={() => onUpdateListedEntitiesChange(value)}
              />
            ))}
          </OptionButtons>
          <OptionDescription>{describeListValues(updateListedEntities)}</OptionDescription>
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
