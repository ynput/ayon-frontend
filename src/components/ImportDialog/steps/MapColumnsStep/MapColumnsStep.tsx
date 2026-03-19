import { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Dropdown } from "@ynput/ayon-react-components"

import { ImportData } from "../../utils"
import { ColumnAction, ColumnMapping, ColumnMappings, ErrorHandlingMode, ResolvedColumnMappings, StepProps } from "../common"
import { StepNavButtons } from "../common.styled"
import DataPreview from "../../components/DataPreview"
import {
    StepContainer,
    Container,
    PreviewHeading,
    Preview,
} from "./MapColumnsStep.styled"
import {
  MappersContainer,
  Mappers,
  MappersTableHeader,
  MappersTableHeaderCell,
  MappersTableBody,
  MappersTableHeaderErrorHandling,
  MappersTableActionCol
} from "../common.styled"
import ColumnMapper, { MappingState, TARGET_OPTION_MAPPING_SEPARATOR } from "../ColumnMapper"
import testImportSchema from "../test_import_schema"
import { confirmDialog } from "primereact/confirmdialog"

type Props = StepProps<ResolvedColumnMappings> & {
  data: ImportData
  importSchema: typeof testImportSchema
}

const actionOptions = [
  {
    value: ColumnAction.MAP,
    label: "Map",
    icon: "line_end_arrow",
  },
  {
    value: ColumnAction.SKIP,
    label: "Skip",
    icon: "block",
  },
]

const errorHandlingOptions = [
  {
    value: ErrorHandlingMode.SKIP,
    label: "Skip Row",
  },
  {
    value: ErrorHandlingMode.DEFAULT,
    label: "Set to default value",
  },
  {
    value: ErrorHandlingMode.ABORT,
    label: "Abort Import",
  },
]

const normaliseColumnName = (name: string) => name.replace(/_\.\s/g, '').toLowerCase();

const inferErrorHandling = (columnSchema: (typeof testImportSchema)["0"]) => {
  return columnSchema.errorHandlingModes[0] as ErrorHandlingMode
}

const inferMapping = (column: string, schema: typeof testImportSchema): ColumnMapping | null => {
  const normalisedColumn = normaliseColumnName(column)
  const columnSchema = schema.find((s) =>
    normalisedColumn === normaliseColumnName(s.key) ||
    normalisedColumn === normaliseColumnName(s.label)
  )

  if (!columnSchema) return null

  return {
    targetColumn: columnSchema.key,
    action: ColumnAction.MAP,
    errorHandlingMode: inferErrorHandling(columnSchema)
  }
}

type Option = { value: string, label: string }
const targetOptionCompareFn = (columnForTarget: Record<string, string>) => (o1: Option, o2: Option) => {
  const bothMapped = columnForTarget[o1.value] && columnForTarget[o2.value]
  const neitherMapped = !columnForTarget[o1.value] && !columnForTarget[o2.value]
  if (bothMapped || neitherMapped) {
    return o1.label.localeCompare(o2.label)
  }

  return columnForTarget[o1.value] ? 1 : -1
}

const getMapperState = (column: string, mappings: ColumnMappings = {}) => {
  const mapping = mappings[column]
  if (!mapping) return MappingState.UNRESOLVED

  const resolvedToMap = mapping.action === ColumnAction.MAP && mapping.targetColumn
  const resolvedToSkip = mapping.action === ColumnAction.SKIP
  if (resolvedToMap || resolvedToSkip) {
    return mapping.userResolved ? MappingState.RESOLVED : MappingState.AUTO_RESOLVED
  }

  return MappingState.UNRESOLVED
}

const mappingUpdater = (
  column: string,
  update: Partial<ColumnMapping>,
  fallback: Partial<ColumnMapping> = {},
) => (old: ColumnMappings | undefined) => {
  const base = old ?? {}
  const mapping = {
    ...fallback,
    ...(base[column] ?? {}),
    ...update,
    userResolved: true,
  }
  return { ...base, [column]: mapping }
}

export default function MapColumnsStep({ data, importSchema, onBack, onNext }: Props) {
  const [mappings, setMappings] = useState<ColumnMappings | undefined>(undefined)
  const [previewColumn, setPreviewColumn] = useState<string | null>(null)

  const columnSettings = useMemo(
    () => Object.fromEntries(importSchema.map((col) => [col.key, col])),
    [importSchema]
  )

  // lookup table for which data column a target is mapped to
  const columnForTarget: Record<string, string> = useMemo(() => {
    if (!mappings) return {}
    return Object.entries(mappings)
      .reduce((dict, [column, mapping]) => {
        if (!mapping.targetColumn) return dict
        return { ...dict, [mapping.targetColumn]: column }
      }, {})
  }, [mappings])

  const targetOptions = useMemo(
    () => importSchema
      .map(({ key, label }) => {
        const column = columnForTarget[key]
        if (!column) return { value: key, label }

        const state = getMapperState(column, mappings)
        return {
          value: key,
          icon: "check",
          color: state === MappingState.AUTO_RESOLVED
            ? 'var(--md-sys-color-tertiary)'
            : 'var(--md-sys-color-primary)',
          label: `${label}${TARGET_OPTION_MAPPING_SEPARATOR}mapped to "${column}"`,
        }
      })
      .sort(targetOptionCompareFn(columnForTarget)),
    [columnForTarget, mappings],
  )

  const unresolvedColumns = useMemo(
    () => {
      const columnsSet = new Set(data.columns)
      if (!mappings) return columnsSet

      const resolvedColumnsSet = new Set(data.columns
        .map((c) => [c, getMapperState(c, mappings)])
        .filter(([, state]) => state !== MappingState.UNRESOLVED)
        .map(([c]) => c),
      )
      return columnsSet.difference(resolvedColumnsSet)
    },
    [data.columns, mappings],
  )

  useEffect(() => {
    if (!columnSettings) return

    // infer mappings based on the schema
    setMappings(Object.fromEntries(
      data.columns
        .map((column) => [column, inferMapping(column, importSchema)])
        .filter(([, mapping]) => !!mapping)
    ))
  }, [importSchema])

  const onTargetChange = useCallback((column: string) => (targetColumn: string) => {
    const updater = mappingUpdater(
      column,
      { targetColumn, action: ColumnAction.MAP },
      { errorHandlingMode: inferErrorHandling(columnSettings[targetColumn]) },
    )

    if (mappings && columnForTarget[targetColumn]) {
      const targetName = targetOptions.find(({ value }) => value === targetColumn)?.label

      confirmDialog({
        header: `"${targetName}" already has a mapping from "${columnForTarget[targetColumn]}"`,
        message: (
          <>
            <p>If you proceed, the mapping will be removed from "{columnForTarget[targetColumn]}".</p>
            <p>Are you sure you want to proceed?</p>
          </>
        ),
        accept: () => {
          // first, delete the existing mapping
          setMappings((old) => {
            if (!old) return old
            const updated = { ...old }
            delete updated[columnForTarget[targetColumn]]
            return updated
          })
          setMappings(updater)
        },
      })
    } else {
      setMappings(updater)
    }
  }, [])

  return (
    <StepContainer>
      <Container>
        <MappersContainer>
          <Mappers>
            <colgroup>
              <col />
              <MappersTableActionCol />
              <col />
              <col />
            </colgroup>
            <MappersTableHeader>
              <tr>
                <MappersTableHeaderCell scope="col">
                  File column
                </MappersTableHeaderCell>
                <MappersTableHeaderCell scope="col">
                </MappersTableHeaderCell>
                <MappersTableHeaderCell scope="col">
                  Target
                </MappersTableHeaderCell>
                <MappersTableHeaderErrorHandling scope="col">
                  On error
                </MappersTableHeaderErrorHandling>
              </tr>
            </MappersTableHeader>
            <MappersTableBody>
            {
              data.columns.map((column) => (
                <ColumnMapper
                  key={column}
                  state={getMapperState(column, mappings)}
                  column={column}
                  action={mappings?.[column]?.action}
                  actions={actionOptions}
                  target={mappings?.[column]?.targetColumn}
                  targetOptions={targetOptions}
                  errorHandling={mappings?.[column]?.errorHandlingMode}
                  errorHandlingOptions={errorHandlingOptions}
                  selected={previewColumn === column}
                  onPointerEnter={() => setPreviewColumn(column)}
                  onTargetChange={onTargetChange(column)}
                  onActionChange={(action) => {
                    setMappings(mappingUpdater(column, { action }))
                  }}
                  onErrorHandlingChange={(errorHandlingMode) => {
                    setMappings(mappingUpdater(column, { errorHandlingMode }))
                  }}
                />
              ))
            }
            </MappersTableBody>
          </Mappers>
        </MappersContainer>
        <Preview>
          <PreviewHeading>Data preview</PreviewHeading>
          <DataPreview data={data} column={previewColumn} />
        </Preview>
      </Container>
      <StepNavButtons>
        <Button
          variant="nav"
          label="Restart"
          onClick={onBack}
        />
        <Button
          variant="filled"
          label="Continue"
          disabled={unresolvedColumns.size > 0}
          data-tooltip={
            unresolvedColumns.size > 0
              ? `Please resolve the following columns: ${Array.from(unresolvedColumns).join(', ')}`
              : undefined
          }
          onClick={() => {
            if (!mappings || unresolvedColumns.size > 0) return
            onNext(mappings as ResolvedColumnMappings)
          }}
        />
      </StepNavButtons>
    </StepContainer>
  )
}
