import { Button } from "@ynput/ayon-react-components"

import { ImportData } from "../../utils"
import { ResolvedColumnMappings, ValueMappings, StepProps, ValueMapping, normaliseForComparison, ImportSchema, ValueAction, ResolvedColumnMapping } from "../common"
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
import { useCallback, useEffect, useMemo, useState } from "react"
import ColumnMapper, { MappingState } from "../ColumnMapper"
import usePreset from "@components/ImportDialog/hooks/usePreset"
import { cloneDeep, merge } from "lodash"
import { ImportableColumn } from "@shared/api/generated/dataImport"

type Props = StepProps<ValueMappings> & {
  data: ImportData
  importSchema: ImportSchema
  columnMappings: ResolvedColumnMappings
  mappings: ValueMappings | null
}

const enumActionOptions = [
  {
    value: ValueAction.MAP,
    label: "Map",
    icon: "line_end_arrow",
  },
]

const actionOptions = [
  {
    value: ValueAction.SKIP,
    label: "Skip",
    icon: "block",
  },
  {
    value: ValueAction.CREATE,
    label: "Create",
    icon: "add",
  },
]

const inferMapping = (value: string, settings: ImportableColumn): ValueMapping | null => {
  // for non-enum columns, we default to creating a new value
  if (!settings.enumItems) {
    return {
      action: ValueAction.CREATE,
      targetValue: value,
    }
  }

  const normalisedValue = normaliseForComparison(value)

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

const getMapperState = (column: string | null, value: string, mappings: ValueMappings | null) => {
  if (!column || !mappings) return MappingState.UNRESOLVED

  const mapping = mappings[column]?.[value]
  if (!mapping) return MappingState.UNRESOLVED

  const resolvedToMap = mapping.action === ValueAction.MAP && mapping.targetValue
  const resolvedToSkip = mapping.action === ValueAction.SKIP
  const resolvedToCreate = mapping.action === ValueAction.CREATE
  if (resolvedToMap || resolvedToSkip || resolvedToCreate) {
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

type SortEntry = [string, ResolvedColumnMapping]

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
  const [selection, setSelection] = useState<Set<string>>(new Set())

  const preset = usePreset()

  const columnSettings = useMemo(
    () => Object.fromEntries(importSchema.map((col) => [col.key, col])),
    [importSchema]
  )

  const mappingsToReview = useMemo(
    () => Object.fromEntries(Object.entries(columnMappings)
      .filter(([, { targetColumn }]) => importSchema.some(
        ({ key }) => targetColumn === key,
      ))),
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
      data.columns.map((column) => {
        const values = getValuesForColumn(
          data,
          column,
          columnSettings[columnMappings[column].targetColumn],
        )

        return [
          column,
          Array.from(new Set(values))
        ]
      })
    ),
    [data.columns, data.rows, columnSettings, columnMappings],
  )

  const currentUniqueValues = useMemo(() => {
    if (!activeColumn) return []
    return uniqueValuesForColumn[activeColumn].sort((v1, v2) => {
      if (!v1) return -1
      return v1.localeCompare(v2)
    })
  }, [activeColumn, uniqueValuesForColumn])

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

        const resolvedValuesSet = new Set(uniqueValues
          .map((value) => [value, getMapperState(column, value, mappings)])
          .filter(([, state]) => state !== MappingState.UNRESOLVED)
          .map(([c]) => c),
        )

        return [column, valuesSet.difference(resolvedValuesSet)]
      })
    ),
    [data.columns, mappings],
  )

  const resolvedColumns = useMemo(
    () => Object
      .keys(mappingsToReview)
      .filter((column) => unresolvedValues[column].size === 0),
    [mappingsToReview, unresolvedValues],
  )

  const getMapperClickHandler = useCallback((uniqueDataValue: string, index: number) => (ctrl: boolean, shift: boolean) => {
    setSelection((s) => {
      const toAdd = new Set([uniqueDataValue])
      if (ctrl) {
        // add or remove this specific mapper from the selection
        return s.has(uniqueDataValue)
          ? s.difference(toAdd)
          : s.union(toAdd)
      } else if (shift && s.size > 0) {
        // select a range of mappers from the first selected one to the clicked one
        const firstSelectedIndex = currentUniqueValues.findIndex((value) => s.has(value))
        if (firstSelectedIndex >= 0) {
          // automatically inverts the range if the first selected index is higher than the clicked index
          const range = currentUniqueValues.slice(
            Math.min(firstSelectedIndex, index),
            Math.max(firstSelectedIndex, index),
          )

          return s
            .union(toAdd)
            .union(new Set(range))
        }
      }
      // If no modifier key pressed or there's no existing selection,
      // just add/remove the current mapper.
      return s.has(uniqueDataValue)
        ? new Set()
        : toAdd
    })
  }, [])

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
    setSelection(new Set())
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
                  <SelectedCount hidden={selection.size === 0}>
                    ({selection.size} / {currentUniqueValues.length} selected)
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
                  key={uniqueDataValue}
                  state={getMapperState(activeColumn, uniqueDataValue, mappings)}
                  column={uniqueDataValue}
                  action={currentMappings?.[uniqueDataValue]?.action}
                  actions={actionOptions.concat(activeTargetIsEnum ? enumActionOptions : [])}
                  target={currentMappings?.[uniqueDataValue]?.targetValue}
                  targetOptions={targetValueOptions}
                  errorHandling={undefined}
                  errorHandlingOptions={[]}
                  errorHandlingEnabled={false}
                  selected={selection.has(uniqueDataValue)}
                  onPointerEnter={() => {}}
                  onClick={getMapperClickHandler(uniqueDataValue, index)}
                  onActionChange={(action) => {
                    if (!activeColumn) return

                    if (selection.size > 0 && selection.has(uniqueDataValue)) {
                      setMappings(mappingUpdater(
                        activeColumn,
                        Array.from(selection),
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
                    if (!currentMappings?.[uniqueDataValue]) {
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
