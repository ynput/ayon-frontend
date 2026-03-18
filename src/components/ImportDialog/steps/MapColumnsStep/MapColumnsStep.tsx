import { useEffect, useMemo, useState } from "react"
import { Button } from "@ynput/ayon-react-components"

import { ImportData } from "../../utils"
import { ColumnAction, ColumnMapping, ColumnMappings, ErrorHandlingMode, StepProps } from "../common"
import { StepNavButtons } from "../common.styled"
import DataPreview from "../../components/DataPreview"
import {
    StepContainer,
    Container,
    MappersContainer,
    Mappers,
    MappersTableHeader,
    MappersTableHeaderCell,
    MappersTableBody, Preview,
    PreviewHeading,
    MappersTableHeaderErrorHandling,
    MappersTableActionCol
} from "./MapColumnsStep.styled"
import ColumnMapper, { MappingState } from "./ColumnMapper"
import testImportSchema from "./test_import_schema"

type Props = StepProps<ColumnMappings> & {
  data: ImportData
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

const normaliseColumnName = (name: string) => name.replace(/_\./g, '').toLowerCase();

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
    errorHandlingMode: columnSchema.errorHandlingModes[0] as ErrorHandlingMode
  }
}

const getMapperState = (column: string, mappings: ColumnMappings = {}) => {
  const mapping = mappings[column]
  if (!mapping) return MappingState.UNRESOLVED

  const resolvedToMap = mapping.action === ColumnAction.MAP && mapping.targetColumn
  const resolvedToSkip = mapping.action === ColumnAction.SKIP
  if (resolvedToMap || resolvedToSkip) {
    return MappingState.RESOLVED
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
  }
  return { ...base, [column]: mapping }
}

export default function MapColumnsStep({ data, onBack, onNext }: Props) {
  const [mappings, setMappings] = useState<ColumnMappings | undefined>(undefined)
  const [previewColumn, setPreviewColumn] = useState<string | null>(null)

  // TODO: get this from the API
  const importSchema = testImportSchema

  const columnSettings = useMemo(
    () => Object.fromEntries(importSchema.map((col) => [col.key, col])),
    [importSchema]
  )

  const targetOptions = useMemo(
    () => importSchema.map(({ key, label }) => ({ value: key, label })),
    [],
  )

  const unresolvedColumns = useMemo(
    () => {
      const columnsSet = new Set(data.columns)
      if (!mappings) return columnsSet

      const resolvedColumnsSet = new Set(data.columns
        .map((c) => [c, getMapperState(c, mappings)])
        .filter(([, state]) => state === MappingState.RESOLVED)
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
                  onClick={() => {
                    if (previewColumn === column) {
                      return setPreviewColumn(null)
                    }
                    setPreviewColumn(column)
                  }}
                  onActionChange={(action) => {
                    setMappings(mappingUpdater(column, { action }))
                  }}
                  onTargetChange={(targetColumn) => {
                    setMappings(mappingUpdater(
                      column,
                      {
                        targetColumn,
                        action: ColumnAction.MAP,
                      },
                      {
                        errorHandlingMode: columnSettings[targetColumn].errorHandlingModes[0] as ErrorHandlingMode
                      },
                    ))
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
            if (!data) return
            onNext({})
          }}
        />
      </StepNavButtons>
    </StepContainer>
  )
}
