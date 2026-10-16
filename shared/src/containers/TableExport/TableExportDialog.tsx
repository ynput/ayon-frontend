import { FC, useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  Dropdown,
  Icon,
  SaveButton,
  SwitchButton,
} from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { useLocalStorage } from '@shared/hooks'
import {
  CSV_DELIMITERS,
  CsvDelimiter,
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
  gap: 20px;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-medium);
`

const SectionTitle = styled.div`
  font-weight: 600;
  color: var(--md-sys-color-on-surface-variant);
`

const Cards = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--base-gap-medium);
`

const Card = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: var(--base-gap-medium);
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  border-radius: var(--border-radius-m);
  border: 1px solid
    ${({ $selected }) =>
      $selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'};
  background-color: ${({ $selected }) =>
    $selected ? 'var(--md-sys-color-primary-container)' : 'transparent'};
  color: ${({ $selected }) =>
    $selected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)'};

  &:hover:not(:disabled) {
    background-color: ${({ $selected }) =>
      $selected
        ? 'var(--md-sys-color-primary-container)'
        : 'var(--md-sys-color-surface-container-high-hover)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .icon {
    color: ${({ $selected }) =>
      $selected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)'};
  }

  .title {
    font-weight: 600;
  }

  .description {
    margin-top: 2px;
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant);
  }
`

const InlineRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-medium);
`

const Note = styled.div<{ $ok?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--base-gap-medium);
  padding: 8px 12px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface-variant);

  .icon {
    color: ${({ $ok }) => ($ok ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-outline)')};
  }

  .text {
    flex: 1;
  }
`

const Muted = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  color: var(--md-sys-color-outline);
`

type CardOption<T> = { value: T; title: string; description: string; disabled?: boolean }

const OptionCards = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: CardOption<T>[]
  value: T
  onChange: (value: T) => void
}) => (
  <Cards role="radiogroup">
    {options.map((option) => {
      const selected = option.value === value
      return (
        <Card
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected}
          $selected={selected}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          <Icon icon={selected ? 'radio_button_checked' : 'radio_button_unchecked'} />
          <div>
            <div className="title">{option.title}</div>
            <div className="description">{option.description}</div>
          </div>
        </Card>
      )
    })}
  </Cards>
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
  const rowsLabel = `${selectedRowsCount} ${selectedRowsCount === 1 ? 'row' : 'rows'}`

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
        <Section>
          <SectionTitle>Rows</SectionTitle>
          <OptionCards
            value={scope}
            onChange={setScope}
            options={[
              {
                value: 'table',
                title: 'Whole table',
                description: 'All rows of the current view, also collapsed ones',
              },
              {
                value: 'selection',
                title: 'Selected rows',
                description: selectedRowsCount ? rowsLabel : 'Select rows in the table first',
                disabled: !selectedRowsCount,
              },
            ]}
          />
          {scope === 'selection' && (
            <SwitchButton
              label="All visible columns, not only the selected ones"
              value={settings.selectionColumns === 'visible'}
              onClick={() =>
                update({
                  selectionColumns:
                    settings.selectionColumns === 'visible' ? 'selected' : 'visible',
                })
              }
              style={{ width: 'fit-content' }}
            />
          )}
        </Section>

        <Section>
          <SectionTitle>Format</SectionTitle>
          <OptionCards
            value={settings.format}
            onChange={(format) => update({ format })}
            options={[
              {
                value: 'xlsx',
                title: 'Excel (.xlsx)',
                description: 'Opens with columns in Excel, Numbers and Google Sheets',
              },
              {
                value: 'csv',
                title: 'CSV',
                description: 'Plain text for other tools, and for Import CSV',
              },
            ]}
          />
          {settings.format === 'csv' && (
            <InlineRow>
              <span>Separated by</span>
              <Dropdown
                value={[settings.delimiter]}
                options={CSV_DELIMITERS}
                onChange={(value) => update({ delimiter: value[0] as CsvDelimiter })}
                style={{ width: 160 }}
              />
              <Muted>Excel in most of Europe expects semicolons</Muted>
            </InlineRow>
          )}
        </Section>

        <Section>
          <SectionTitle>Content</SectionTitle>
          <OptionCards
            value={settings.content}
            onChange={(content) => update({ content })}
            options={[
              {
                value: 'readable',
                title: 'Readable',
                description: 'Column names as in the table, values as shown: labels, full names',
              },
              {
                value: 'raw',
                title: 'Raw',
                description: 'Field names and stored values, e.g. attrib.priority: normal',
              },
            ]}
          />
          {canImport && (
            <SwitchButton
              label="Add entity type and path columns"
              value={settings.includeImportColumns}
              onClick={() => update({ includeImportColumns: !settings.includeImportColumns })}
              style={{ width: 'fit-content' }}
            />
          )}
        </Section>

        {canImport &&
          (importable ? (
            <Note $ok>
              <Icon icon="check_circle" />
              <div className="text">Import CSV can read this file back.</div>
            </Note>
          ) : (
            <Note>
              <Icon icon="info" />
              <div className="text">
                To import the file back, export a raw CSV with entity type and path.
              </div>
              <Button
                label="Use import settings"
                variant="text"
                onClick={() => update(IMPORTABLE_SETTINGS)}
              />
            </Note>
          ))}
        {!!skippedColumns.length && (
          <Muted>
            <Icon icon="visibility_off" />
            Not exported: {skippedColumns.join(', ')}
          </Muted>
        )}
      </Body>
    </Dialog>
  )
}
