import { FC, ReactNode, useEffect, useState } from 'react'
import { Button, Dialog, FormRow, Icon, SaveButton } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { useLocalStorage } from '@shared/hooks'
import {
  CSV_DELIMITERS,
  DEFAULT_TABLE_EXPORT_SETTINGS,
  IMPORTABLE_SETTINGS,
  isImportable,
  TABLE_EXPORT_SETTINGS_KEY,
  TableExportScope,
  TableExportSettings,
} from './tableExportSettings'

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-medium);

  .label {
    min-width: 120px;
  }
`

const Options = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--base-gap-small);
`

const Note = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  color: var(--md-sys-color-outline);

  button {
    margin-left: auto;
  }
`

type Option<T> = { value: T; label: ReactNode; disabled?: boolean }

const OptionButtons = <T extends string | boolean>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}) => (
  <Options>
    {options.map((option) => (
      <Button
        key={String(option.value)}
        label={option.label as string}
        variant="surface"
        selected={option.value === value}
        disabled={option.disabled}
        onClick={() => onChange(option.value)}
      />
    ))}
  </Options>
)

export type TableExportDialogProps = {
  isOpen: boolean
  onClose: () => void
  initialScope: TableExportScope
  selectedRowsCount: number // selection scope is disabled without rows
  canImport?: boolean // the rows can be imported back with Import CSV
  // labels of visible columns the export can't include (thumbnails, links...)
  getSkippedColumns?: (scope: TableExportScope, settings: TableExportSettings) => string[]
  // resolves to false when the export failed, the dialog then stays open
  onExport: (scope: TableExportScope, settings: TableExportSettings) => Promise<boolean>
}

export const TableExportDialog: FC<TableExportDialogProps> = ({
  isOpen,
  onClose,
  initialScope,
  selectedRowsCount,
  canImport,
  getSkippedColumns,
  onExport,
}) => {
  const [savedSettings, setSavedSettings] = useLocalStorage<TableExportSettings>(
    TABLE_EXPORT_SETTINGS_KEY,
    DEFAULT_TABLE_EXPORT_SETTINGS,
  )
  const settings = { ...DEFAULT_TABLE_EXPORT_SETTINGS, ...savedSettings }
  const update = (patch: Partial<TableExportSettings>) =>
    setSavedSettings({ ...settings, ...patch })

  const [scope, setScope] = useState<TableExportScope>(initialScope)
  const [isExporting, setIsExporting] = useState(false)
  useEffect(() => {
    if (isOpen) setScope(selectedRowsCount ? initialScope : 'table')
  }, [isOpen, initialScope, selectedRowsCount])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (await onExport(scope, settings)) onClose()
    } finally {
      setIsExporting(false)
    }
  }

  const skippedColumns = getSkippedColumns?.(scope, settings) || []
  const importable = isImportable(settings)

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      header="Export"
      size="md"
      style={{ maxHeight: '90vh' }}
      footer={
        <SaveButton
          label={`Export ${settings.format === 'xlsx' ? 'Excel' : 'CSV'}`}
          icon="download"
          active
          saving={isExporting}
          onClick={handleExport}
        />
      }
    >
      <Body>
        <FormRow label="Rows">
          <OptionButtons
            value={scope}
            onChange={setScope}
            options={[
              {
                value: 'selection',
                label: `Selected rows (${selectedRowsCount})`,
                disabled: !selectedRowsCount,
              },
              { value: 'table', label: 'Whole table' },
            ]}
          />
        </FormRow>
        {scope === 'selection' && (
          <FormRow label="Columns">
            <OptionButtons
              value={settings.selectionColumns}
              onChange={(selectionColumns) => update({ selectionColumns })}
              options={[
                { value: 'selected', label: 'Selected columns' },
                { value: 'visible', label: 'All visible columns' },
              ]}
            />
          </FormRow>
        )}
        <FormRow label="Format">
          <OptionButtons
            value={settings.format}
            onChange={(format) => update({ format })}
            options={[
              { value: 'xlsx', label: 'Excel (.xlsx)' },
              { value: 'csv', label: 'CSV' },
            ]}
          />
        </FormRow>
        {settings.format === 'csv' && (
          <FormRow label="Delimiter">
            <OptionButtons
              value={settings.delimiter}
              onChange={(delimiter) => update({ delimiter })}
              options={CSV_DELIMITERS}
            />
          </FormRow>
        )}
        <FormRow label="Column names">
          <OptionButtons
            value={settings.header}
            onChange={(header) => update({ header })}
            options={[
              { value: 'label', label: 'Labels' },
              { value: 'key', label: 'Field names' },
            ]}
          />
        </FormRow>
        <FormRow label="Values">
          <OptionButtons
            value={settings.values}
            onChange={(values) => update({ values })}
            options={[
              { value: 'label', label: 'Labels' },
              { value: 'value', label: 'Raw values' },
            ]}
          />
        </FormRow>
        {canImport && (
          <FormRow label="Import columns">
            <OptionButtons
              value={settings.includeImportColumns}
              onChange={(includeImportColumns) => update({ includeImportColumns })}
              options={[
                { value: false, label: 'Leave out' },
                { value: true, label: 'Add entity type and path' },
              ]}
            />
          </FormRow>
        )}
        {canImport && (
          <Note>
            <Icon icon={importable ? 'check_circle' : 'info'} />
            {importable
              ? 'Import CSV can read this file back.'
              : 'To import the file back, export a CSV with field names, raw values and the import columns.'}
            {!importable && (
              <Button
                label="Use import settings"
                variant="text"
                onClick={() => update(IMPORTABLE_SETTINGS)}
              />
            )}
          </Note>
        )}
        {!!skippedColumns.length && (
          <Note>
            <Icon icon="visibility_off" />
            Not exported: {skippedColumns.join(', ')}
          </Note>
        )}
      </Body>
    </Dialog>
  )
}
