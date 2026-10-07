import { Button } from '@ynput/ayon-react-components'
import { DuplicateItemStrategy } from '@shared/api/generated/dataImport'
import { ImportContext } from '../common'
import {
  describeImportMode,
  describeRowsEntityType,
  duplicateStrategyOptions,
  hasDuplicateStrategy,
  ImportMode,
  importModeOptions,
  RowsEntityType,
  rowsEntityTypeOptions,
} from '../importMode'
import { OptionButtons, OptionDescription, OptionLabel, Options } from './ImportOptions.styled'

type Props = {
  importContext: ImportContext
  importMode: ImportMode
  onImportModeChange: (importMode: ImportMode) => void
  rowsEntityType: RowsEntityType
  onRowsEntityTypeChange: (rowsEntityType: RowsEntityType) => void
  duplicateStrategy: DuplicateItemStrategy
  onDuplicateStrategyChange: (duplicateStrategy: DuplicateItemStrategy) => void
}

export default function ImportOptions({
  importContext,
  importMode,
  onImportModeChange,
  rowsEntityType,
  onRowsEntityTypeChange,
  duplicateStrategy,
  onDuplicateStrategyChange,
}: Props) {
  return (
    <Options>
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
            {duplicateStrategyOptions.map(({ value, label, icon }) => (
              <Button
                key={value}
                icon={icon}
                label={label}
                selected={duplicateStrategy === value}
                onClick={() => onDuplicateStrategyChange(value)}
              />
            ))}
          </OptionButtons>
          <OptionDescription>
            When a Name matches several folders or tasks and there is no Path to tell them apart.
          </OptionDescription>
        </>
      )}
    </Options>
  )
}
