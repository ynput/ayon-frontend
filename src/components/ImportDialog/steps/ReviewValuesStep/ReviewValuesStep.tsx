import { Button } from "@ynput/ayon-react-components"

import { ImportData } from "../../utils"
import { ValueMappings, StepProps, ValueMapping, normaliseForComparison, ImportSchema, ValueAction, TargetValue, ColumnMappings, ValueMappableColumnMappings, ValueMappableColumnMapping, ColumnAction } from "../common"
import {
  Mappers,
  MappersTableHeader,
  MappersTableHeaderCell,
  MappersTableBody, MappersTableActionCol,
  StepNavButtons,
  StepNavStats,
  StepContainer,
} from "../common.styled"
import {
  Container,
  ColumnsListWrapper,
  Heading,
  ColumnsList,
  ColumnsListButton,
  ValueMappersContainer,
  ColumnsListItemStats,
  SelectedCount,
  ColumnsListScrollable,
} from "./ReviewValuesStep.styled"
import { useEffect, useMemo, useState } from "react"
import ColumnMapper, { MappingState } from "../ColumnMapper"
import usePreset from "@components/ImportDialog/hooks/usePreset"
import { cloneDeep, merge } from "lodash"
import { ImportableColumn } from "@shared/api/generated/dataImport"
import useMultiSelect from "@components/ImportDialog/hooks/useMultiSelect"

type Props = StepProps<ValueMappings> & {
  data: ImportData
  importSchema: ImportSchema
  columnMappings: ColumnMappings
  mappings: ValueMappings | null
}

const mapActionOption = {
  value: ValueAction.MAP,
  label: "Map",
  icon: "line_end_arrow",
}
const skipActionOption = {
  value: ValueAction.SKIP,
  label: "Skip",
  icon: "block",
}
const createActionOption = {
  value: ValueAction.CREATE,
  label: "Create",
  icon: "add",
}

const getActionOptions = (isEnum: boolean, valueType: ImportableColumn["valueType"]) => {
  if (valueType === "boolean") {
    return [mapActionOption, skipActionOption]
  }

  if (isEnum) {
    return [mapActionOption, createActionOption, skipActionOption]
  }

  return [createActionOption, skipActionOption]
}

const truthyBooleanStrings = new Set(["true", "yes", "1", "on", "ano", "ja", "si"])
const falsyBooleanStrings = new Set(["false", "no", "0", "off", "ne", "nein", "no"])

const inferMapping = (value: string, settings: ImportableColumn): ValueMapping | null => {
  const normalisedValue = normaliseForComparison(value)
  if (settings.valueType === "boolean") {
    if (truthyBooleanStrings.has(normalisedValue)) {
      return {
        action: ValueAction.MAP,
        targetValue: true,
      }
    } else if (falsyBooleanStrings.has(normalisedValue)) {
      return {
        action: ValueAction.MAP,
        targetValue: false,
      }
    } else {
      return {
        action: ValueAction.SKIP,
        targetValue: false,
      }
    }
  }

  // for non-enum columns, we default to creating a new value
  if (!settings.enumItems) {
    return {
      action: ValueAction.CREATE,
      targetValue: value,
    }
  }

  const inferredEnum = settings.enumItems?.find((e) =>
    normalisedValue === normaliseForComparison(`${e.value}`) ||
    normalisedValue === normaliseForComparison(e.label)
  )

  if (!inferredEnum) return null

  return {
    targetValue: `${inferredEnum.value}`,
    action: ValueAction.MAP,
  }
}

const validateValue = (settings: ImportableColumn, value: TargetValue) => {
  if (typeof value === "boolean") {
    return settings.valueType === "boolean"
  }

  switch (settings.valueType) {
    case "integer":
      return /[0-9]+/.test(value)
    case "boolean":
      return /true|false/i.test(value)
    case "float":
      return !Number.isNaN(parseFloat(value))
    case "string":
    // we don't know how to validate the types below - yet!
    case "dict":
    case "datetime":
    case "list_of_strings":
    case "list_of_any":
    case "list_of_integers":
    case "list_of_submodels":
    default:
      return true
  }
}

const getMapperState = (settings: ImportableColumn, column: string | null, value: string, mappings: ValueMappings | null) => {
  if (!column || !mappings) return MappingState.UNRESOLVED

  const mapping = mappings[column]?.[value]
  if (!mapping) return MappingState.UNRESOLVED

  const resolvedToMap = mapping.action === ValueAction.MAP && mapping.targetValue
  const resolvedToSkip = mapping.action === ValueAction.SKIP
  const resolvedToCreate = mapping.action === ValueAction.CREATE
  if (resolvedToMap || resolvedToSkip || resolvedToCreate) {
    if (resolvedToCreate && !validateValue(settings, mapping.targetValue)) {
      return MappingState.ERROR
    }

    return mapping.userResolved ? MappingState.RESOLVED : MappingState.AUTO_RESOLVED
  }

  return MappingState.UNRESOLVED
}

const mappingUpdater = (
  column: string,
  values: string[],
  update: Partial<ValueMapping>,
  callback?: (mappings: ValueMappings) => void,
) => (old: ValueMappings | null) => {
  const base = old ?? {}
  const columnBase = base[column] ?? {}

  const updated = values.map((value: string) => ({
    [value]: {
      ...(columnBase[value] ?? { }),
      ...update,
      userResolved: true,
    },
  }))

  const mappings = {
    ...cloneDeep(base),
    [column]: merge(
      cloneDeep(columnBase),
      ...updated,
    ),
  }

  callback?.(mappings)
  return mappings
}

const possibleDelimiters = [
  ",",
  ";",
  "/",
  "|",
  "\t",
  "\n",
  " ",
]

const tryParseJSONArray = (text: string) => {
  const array = JSON.parse(text)
  if (!Array.isArray(array)) throw new Error()
  return array
}

const extractListOfStrings = (text: string) => {
  try {
    let array = []
    try {
      array = tryParseJSONArray(text)
    } catch {
      array = tryParseJSONArray(text.replaceAll("'", '"'))
    }
    return array
  } catch {
    for (const delimiter of possibleDelimiters) {
      const parts = text.split(delimiter)
      if (parts.length === 0) continue

      return parts.map((p) => p.trim())
    }
  }

  return []
}

// Returns all values found in `data` for a given column based on its settings.
// For columns of type `list_of_string`, it tries to parse each value as a JSON array,
// then a plain list with various separators.
const getValuesForColumn = (data: ImportData, column: string, settings: ImportableColumn) => {
  if (settings.valueType === "list_of_strings") {
    return data.rows
      .map((row) => {
        if (!row[column]) return []
        return extractListOfStrings(`${row[column]}`)
      })
      .flat()
  }

  return data.rows.map((row) => {
    switch (typeof row[column]) {
      case "undefined":
        return undefined
      case "object":
        // coerce null to undefined
        return row[column] ?? undefined
      default:
        return `${row[column]}`
    }
  })
}

type SortEntry = [string, ValueMappableColumnMapping]

const sortMappingsToReviewEntries = (resolvedColumns: string[]) => ([m1]: SortEntry, [m2]: SortEntry) => {
  const m1Resolved = resolvedColumns.includes(m1)
  const m2Resolved = resolvedColumns.includes(m2)
  if (m1Resolved && m2Resolved || (!m1Resolved && !m2Resolved)) {
    return m1.localeCompare(m2)
  }

  return m1Resolved ? 1 : -1
}

const enumTypes: ImportableColumn["valueType"][] = [
  "string",
  "list_of_strings",
]

export default function ReviewValuesStep({ data, importSchema, columnMappings, mappings: defaultMappings, onBack, onNext }: Props) {
  const [mappings, setMappings] = useState<ValueMappings | null>(defaultMappings)

  const preset = usePreset()

  const columnSettings = useMemo(
    () => Object.fromEntries(importSchema.map((col) => [col.key, col])),
    [importSchema]
  )

  const mappingsToReview: ValueMappableColumnMappings = useMemo(
    () => Object.fromEntries(Object.entries(columnMappings)
      .filter(([, { action, targetColumn }]) => importSchema.some(
        ({ key }) => targetColumn === key && action !== ColumnAction.SKIP,
      ))
      .map(([column, mapping]) => [column, mapping as ValueMappableColumnMapping])
    ),
    [columnMappings, importSchema]
  )

  // default to the first reviewable target
  const [activeTarget, setActiveTarget] = useState<string>(
    Object.values(mappingsToReview)[0].targetColumn,
  )

  const [activeColumn, activeMapping] = useMemo(() => {
    const entry = Object.entries(mappingsToReview)
      .find(([, { targetColumn }]) => targetColumn === activeTarget)

    return entry ?? [null, null]
  }, [mappingsToReview, activeTarget])

  const activeTargetType = useMemo(
    () => columnSettings[activeTarget].valueType,
    [columnSettings, activeTarget],
  )

  const activeTargetIsEnum = useMemo(
    () => columnSettings[activeTarget].enumItems?.length,
    [columnSettings, activeTarget]
  )

  const uniqueValuesForColumn = useMemo(
    () => Object.fromEntries(
      Object.keys(mappingsToReview)
        .map((column) => {
          const values = getValuesForColumn(
            data,
            column,
            columnSettings[mappingsToReview[column].targetColumn],
          )

          return [
            column,
            Array.from(new Set(values))
          ]
        })
    ),
    [data.rows, columnSettings, mappingsToReview],
  )

  const currentUniqueValues = useMemo(() => {
    if (!activeColumn) return []
    return uniqueValuesForColumn[activeColumn].sort((v1, v2) => {
      if (!v1) return -1
      return v1.localeCompare(v2)
    })
  }, [activeColumn, uniqueValuesForColumn])

  const multiSelect = useMultiSelect({ items: currentUniqueValues })

  const targetValueOptions = useMemo(() => {
    if (!activeMapping) return []

    if (enumTypes.includes(activeTargetType)) {
      const { enumItems } = columnSettings[activeMapping.targetColumn]
      if (!enumItems) return []

      return enumItems
    }

    return []
  }, [activeMapping, columnSettings, activeTargetType])

  const currentMappings = useMemo(
    () => mappings && activeColumn ? mappings[activeColumn] : null,
    [mappings, activeColumn],
  )

  const unresolvedValues = useMemo(
    () => Object.fromEntries(
      Object.entries(uniqueValuesForColumn).map(([column, uniqueValues]) => {
        const valuesSet = new Set(uniqueValues)
        if (!mappings) return [column, valuesSet]

        const settings = columnSettings[mappingsToReview[column].targetColumn]
        const resolvedValuesSet = new Set(uniqueValues
          .map((value) => [value, getMapperState(settings, column, value, mappings)])
          .filter(([, state]) => state !== MappingState.UNRESOLVED)
          .map(([c]) => c),
        )

        return [column, valuesSet.difference(resolvedValuesSet)]
      })
    ),
    [data.columns, mappings, mappingsToReview],
  )

  const resolvedColumns = useMemo(
    () => Object
      .keys(mappingsToReview)
      .filter((column) => unresolvedValues[column].size === 0),
    [mappingsToReview, unresolvedValues],
  )

  useEffect(() => {
    if (!columnSettings || Boolean(mappings)) return
    // infer mappings based on the schema
    setMappings(Object.fromEntries(
      Object.entries(mappingsToReview).map(([column, { targetColumn }]) => [
        column,
        Object.fromEntries(
          uniqueValuesForColumn[column]
            .map((value) => {
              if (value === undefined && !columnSettings[targetColumn].enumItems) {
                return [`${value}`, { action: ValueAction.SKIP }]
              }

              return [`${value}`, inferMapping(`${value}`, columnSettings[targetColumn])]
            })
            .filter(([, mapping]) => !!mapping)
        ),
      ])
    ))
  }, [columnSettings])

  // apply the current preset if it changes
  useEffect(() => {
    if (!preset.current.columns) return

    setMappings((m) => merge(cloneDeep(m), cloneDeep(preset.current.values)))
  }, [preset.current])

  // reset selection if target changes
  useEffect(() => {
    multiSelect.reset()
  }, [activeTarget])

  return (
    <StepContainer>
      <Container>
        <ColumnsListWrapper>
          <Heading>Columns</Heading>
          <ColumnsListScrollable>
            <ColumnsList>
              {
                Object.entries(mappingsToReview)
                  .sort(sortMappingsToReviewEntries(resolvedColumns))
                  .map(([column, { targetColumn }]) => (
                  <li key={targetColumn}>
                    <ColumnsListButton
                      variant="text"
                      icon={resolvedColumns.includes(column) ? "check" : "error"}
                      iconProps={{
                        style: {
                          color: resolvedColumns.includes(column)
                            ? "var(--md-sys-color-tertiary)"
                            : "var(--md-sys-color-error)"
                        }
                      }}
                      selected={activeTarget === targetColumn}
                      onClick={() => setActiveTarget(targetColumn)}
                    >
                      {
                        columnSettings[targetColumn].label
                      }
                      <ColumnsListItemStats>
                        {
                          uniqueValuesForColumn[column].length - unresolvedValues[column].size
                        } / {
                          uniqueValuesForColumn[column].length
                        }
                      </ColumnsListItemStats>
                    </ColumnsListButton>
                  </li>
                ))
              }
            </ColumnsList>
          </ColumnsListScrollable>
        </ColumnsListWrapper>
        <ValueMappersContainer>
          <Mappers>
            <colgroup>
              <col style={{ width: "40%" }} />
              <MappersTableActionCol />
              <col />
            </colgroup>
            <MappersTableHeader>
              <tr>
                <MappersTableHeaderCell scope="col">
                  Raw Data
                  <SelectedCount hidden={multiSelect.selection.size === 0}>
                    ({multiSelect.selection.size} / {currentUniqueValues.length} selected)
                  </SelectedCount>
                </MappersTableHeaderCell>
                <MappersTableHeaderCell scope="col">
                  Action
                </MappersTableHeaderCell>
                <MappersTableHeaderCell scope="col">
                  Mapped Value
                </MappersTableHeaderCell>
              </tr>
            </MappersTableHeader>
            <MappersTableBody>
            {
              currentUniqueValues.map((uniqueDataValue, index) => (
                <ColumnMapper
                  key={uniqueDataValue + index}
                  state={getMapperState(columnSettings[activeTarget], activeColumn, uniqueDataValue, mappings)}
                  source={uniqueDataValue}
                  action={currentMappings?.[uniqueDataValue]?.action}
                  actions={getActionOptions(!!activeTargetIsEnum, columnSettings[activeTarget].valueType)}
                  target={currentMappings?.[uniqueDataValue]?.targetValue}
                  targetOptions={targetValueOptions}
                  errorHandling={undefined}
                  errorHandlingOptions={[]}
                  errorHandlingEnabled={false}
                  valueType={columnSettings[activeTarget].valueType}
                  selected={multiSelect.selection.has(uniqueDataValue)}
                  onPointerEnter={() => {}}
                  onClick={multiSelect.getClickHandler(uniqueDataValue, index)}
                  onActionChange={(action) => {
                    if (!activeColumn) return

                    if (multiSelect.selection.size > 0 && multiSelect.selection.has(uniqueDataValue)) {
                      setMappings(mappingUpdater(
                        activeColumn,
                        Array.from(multiSelect.selection),
                        { action: action as ValueAction },
                        preset.updateValues,
                      ))

                      return
                    }

                    setMappings(mappingUpdater(
                      activeColumn,
                      [uniqueDataValue],
                      { action: action as ValueAction },
                      preset.updateValues,
                    ))
                  }}
                  onTargetChange={(targetValue) => {
                    if (!activeColumn) return

                    const update: Partial<ValueMapping> = { targetValue }
                    if (!currentMappings?.[uniqueDataValue] && columnSettings[activeTarget].valueType !== "boolean") {
                      update.action = activeTargetIsEnum ? ValueAction.MAP : ValueAction.CREATE
                    }

                    setMappings(mappingUpdater(
                      activeColumn,
                      [uniqueDataValue],
                      update,
                      preset.updateValues,
                    ))
                  }}
                  onErrorHandlingChange={() => {}}
                />
              ))
            }
            </MappersTableBody>
          </Mappers>
        </ValueMappersContainer>
      </Container>
      <StepNavButtons>
        <StepNavStats>
          {resolvedColumns.length} / {Object.keys(mappingsToReview).length} columns resolved.
        </StepNavStats>
        <Button
          variant="nav"
          label="Back"
          onClick={() => onBack(mappings ?? undefined)}
        />
        <Button
          disabled={resolvedColumns.length !== Object.keys(mappingsToReview).length}
          variant="filled"
          label="Continue"
          onClick={() => {
            if (!mappings) return
            onNext(mappings)
          }}
        />
      </StepNavButtons>
    </StepContainer>
  )
}
