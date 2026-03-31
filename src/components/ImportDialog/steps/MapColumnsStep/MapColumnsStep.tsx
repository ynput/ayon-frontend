import { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Icon, SwitchButton } from "@ynput/ayon-react-components"

import { ImportData } from "../../utils"
import {
  ColumnAction, ColumnMappings,
  ErrorHandlingMode,
  ImportSchema, StepProps,
  TargetColumn
} from "../common"
import {
  MappersTableErrorHandlingCol,
  StepContainer,
  StepNavButtons,
  StepNavStats,
  StepNavStatsRequired,
} from "../common.styled"
import DataPreview from "./DataPreview"
import {
  Container,
  PreviewHeading,
  Preview,
  MultipleColumnsPreview,
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
import { confirmDialog } from "primereact/confirmdialog"
import usePreset from "@components/ImportDialog/hooks/usePreset"
import useMultiSelect from "@components/ImportDialog/hooks/useMultiSelect"
import { inferErrorHandling, inferMapping } from "./inferMapping"
import { mappingUpdater } from "./mappingUpdater"
import { getMapperState } from "./getMapperState"
import { targetOptionCompareFn } from "./sorting"

type Props = StepProps<ColumnMappings> & {
  data: ImportData
  mappings?: ColumnMappings
  importSchema: ImportSchema
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

export default function MapColumnsStep({ data, mappings: defaultMappings, importSchema, onBack, onNext }: Props) {
  const [mappings, setMappings] = useState<ColumnMappings | undefined>(defaultMappings)
  const [previewColumn, setPreviewColumn] = useState<string | null>(null)
  const [previewUnique, setPreviewUnique] = useState(true)

  const columnSettings = useMemo(
    () => Object.fromEntries(importSchema.map((col) => [col.key, col])),
    [importSchema]
  )

  const preset = usePreset()
  const multiSelect = useMultiSelect({ items: data.columns })

  // lookup table for which data column a target is mapped to
  const columnForTarget: Record<string, string> = useMemo(() => {
    if (!mappings) return {}
    return Object.entries(mappings)
      .reduce((dict, [column, mapping]) => {
        if (!mapping.targetColumn) return dict
        return { ...dict, [mapping.targetColumn]: column }
      }, {})
  }, [mappings])

  const unmappedRequiredTargets = useMemo(
    () => {
      return importSchema
        .filter(({ key, required }) => {
          if (!required) return false
          return !Object
            .values(mappings ?? {})
            .some(({ targetColumn, action }) => (
              action === ColumnAction.MAP &&
              targetColumn === key
            ))
        })
    },
    [mappings, importSchema, columnForTarget]
  )

  const targetOptions = useMemo(
    () => importSchema
      .map(({ key, label, required, valueType, enumItems }) => {
        const column = columnForTarget[key]
        if (!column) return {
          value: key,
          label: required ? `${label} (required)` : label,
          icon: required ? "warning" : undefined,
          color: "var(--md-sys-color-warning)",
          type: valueType,
          isEnum: Boolean(enumItems),
        }

        const state = getMapperState(column, mappings)
        return {
          value: key,
          icon: "check",
          color: state === MappingState.AUTO_RESOLVED
            ? 'var(--md-sys-color-tertiary)'
            : 'var(--md-sys-color-primary)',
          label: `${label}${TARGET_OPTION_MAPPING_SEPARATOR}mapped to "${column}"`,
          type: valueType,
          isEnum: Boolean(enumItems),
        }
      })
      .sort(targetOptionCompareFn(columnForTarget, columnSettings)),
    [columnForTarget, columnSettings, mappings],
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
    if (!columnSettings || Boolean(mappings)) return

    // infer mappings based on the schema
    setMappings(Object.fromEntries(
      data.columns
        .map((column) => [column, inferMapping(column, importSchema)])
        .filter(([, mapping]) => !!mapping)
    ))
  }, [importSchema])

  // apply the current preset if it changes
  useEffect(() => {
    if (!preset.current.columns) return

    // Ensure only columns which are in the CSV get mapped,
    // since the preset might include other irrelevant mappings
    // to one of the targets.
    const filteredPreset = Object.fromEntries(
      Object.entries(preset.current.columns)
        .filter(([column]) => data.columns.includes(column)),
    )
    setMappings((m) => ({ ...m, ...filteredPreset }))
  }, [preset.current])

  const onTargetChange = useCallback((column: string) => (targetColumn: TargetColumn) => {
    const updater = mappingUpdater(
      [column],
      { targetColumn, action: ColumnAction.MAP },
      { errorHandlingMode: inferErrorHandling(columnSettings[targetColumn]) },
      preset.updateColumns,
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
  }, [mappings, targetOptions, columnForTarget, columnSettings])

  return (
    <StepContainer>
      <Container>
        <MappersContainer>
          <Mappers>
            <colgroup>
              <col style={{ width: "30%" }} />
              <MappersTableActionCol />
              <col />
              <MappersTableErrorHandlingCol />
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
              data.columns.map((column, index) => (
                <ColumnMapper
                  key={column}
                  state={getMapperState(column, mappings)}
                  source={column}
                  action={mappings?.[column]?.action}
                  actions={actionOptions}
                  target={mappings?.[column]?.targetColumn}
                  targetOptions={targetOptions}
                  errorHandling={mappings?.[column]?.errorHandlingMode}
                  errorHandlingOptions={errorHandlingOptions}
                  selected={multiSelect.selection.has(column)}
                  onPointerEnter={() => setPreviewColumn(column)}
                  onClick={multiSelect.getClickHandler(column, index)}
                  onTargetChange={(target) => onTargetChange(column)(target as TargetColumn)}
                  onActionChange={(action) => {
                    if (multiSelect.selection.size > 0 && multiSelect.selection.has(column)) {
                      setMappings(mappingUpdater(
                        Array.from(multiSelect.selection),
                        { action: action as ColumnAction },
                        {},
                        preset.updateColumns,
                      ))
                      return
                    }

                    setMappings(mappingUpdater(
                      [column],
                      { action: action as ColumnAction },
                      {},
                      preset.updateColumns,
                    ))
                  }}
                  onErrorHandlingChange={(errorHandlingMode) => {
                    setMappings(mappingUpdater(
                      [column],
                      { errorHandlingMode },
                      {},
                      preset.updateColumns,
                    ))
                  }}
                />
              ))
            }
            </MappersTableBody>
          </Mappers>
        </MappersContainer>
        <Preview>
          <PreviewHeading>
            Data preview
            <SwitchButton
              label="Show unique values"
              value={previewUnique}
              disabled={multiSelect.selection.size > 1}
              onClick={() => setPreviewUnique(!previewUnique)}
              variant="secondary"
              pt={{
                switch: { compact: true },
              }}
            />
          </PreviewHeading>
          {
            multiSelect.selection.size > 1
            ? (
              <MultipleColumnsPreview>
                {multiSelect.selection.size} columns selected
              </MultipleColumnsPreview>
            ) : (
              <DataPreview
                data={data}
                column={Array.from(multiSelect.selection).at(0) ?? previewColumn}
                unique={previewUnique}
              />
            )
          }
        </Preview>
      </Container>
      <StepNavButtons>
        <StepNavStats>
          {data.columns.length - unresolvedColumns.size} / {data.columns.length} columns resolved.
          {
            unmappedRequiredTargets.length > 0 && (
              <StepNavStatsRequired>
                <Icon icon="warning" style={{ color: "inherit" }} />
                {unmappedRequiredTargets.length} required target{
                  unmappedRequiredTargets.length === 1 ? "" : "s"
                } must be mapped: {
                  unmappedRequiredTargets.map(({ label }) => label).join(", ")
                }
              </StepNavStatsRequired>
            )
          }
        </StepNavStats>
        <Button
          variant="nav"
          label="Restart"
          onClick={() => onBack()}
        />
        <Button
          variant="filled"
          label="Continue"
          disabled={unresolvedColumns.size > 0 || unmappedRequiredTargets.length > 0}
          data-tooltip={
            unresolvedColumns.size > 0
              ? `Please resolve the following columns: ${Array.from(unresolvedColumns).join(', ')}`
              : undefined
          }
          onClick={() => {
            if (!mappings || unresolvedColumns.size > 0) return
            onNext(mappings as ColumnMappings)
          }}
        />
      </StepNavButtons>
    </StepContainer>
  )
}
