import { Button } from "@ynput/ayon-react-components"

import { ImportData } from "../../utils"
import { ColumnAction, ResolvedColumnMappings, ValueMappings, StepProps, ValueMapping, normaliseForComparison } from "../common"
import {
  Mappers,
  MappersTableHeader,
  MappersTableHeaderCell,
  MappersTableBody, MappersTableActionCol,
  StepNavButtons,
  StepNavStats,
} from "../common.styled"
import {
  StepContainer,
  Container,
  ColumnsListWrapper,
  Heading,
  ColumnsList,
  ColumnsListButton,
  ValueMappersContainer,
  ColumnsListItemStats,
} from "./ReviewValuesStep.styled"
import testImportSchema from "../test_import_schema"
import { useEffect, useMemo, useState } from "react"
import ColumnMapper, { MappingState } from "../ColumnMapper"

type Props = StepProps<ValueMappings> & {
  data: ImportData
  importSchema: typeof testImportSchema
  columnMappings: ResolvedColumnMappings
  mappings: ValueMappings | null
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
  {
    value: ColumnAction.CREATE,
    label: "Create",
    icon: "add",
  },
]

const inferMapping = (value: string, settings: (typeof testImportSchema)["0"]): ValueMapping | null => {
  const normalisedValue = normaliseForComparison(value)

  const inferredEnum = settings.enumItems?.find((e) =>
    normalisedValue === normaliseForComparison(e.value) ||
    normalisedValue === normaliseForComparison(e.label)
  )

  if (!inferredEnum) return null

  return {
    targetValue: inferredEnum.value,
    action: ColumnAction.MAP,
  }
}

const getMapperState = (column: string | null, value: string, mappings: ValueMappings | null) => {
  if (!column || !mappings) return MappingState.UNRESOLVED

  const mapping = mappings[column]?.[value]
  if (!mapping) return MappingState.UNRESOLVED

  const resolvedToMap = mapping.action === ColumnAction.MAP && mapping.targetValue
  const resolvedToSkip = mapping.action === ColumnAction.SKIP
  const resolvedToCreate = mapping.action === ColumnAction.CREATE
  if (resolvedToMap || resolvedToSkip || resolvedToCreate) {
    return mapping.userResolved ? MappingState.RESOLVED : MappingState.AUTO_RESOLVED
  }

  return MappingState.UNRESOLVED
}

const mappingUpdater = (
  column: string,
  value: string,
  update: Partial<ValueMapping>,
  fallback: Partial<ValueMapping> = {},
) => (old: ValueMappings | null) => {
  const base = old ?? {}
  const columnBase = base[column] ?? {}
  const mapping = {
    ...fallback,
    ...(columnBase[value] ?? { }),
    ...update,
    userResolved: true,
  }

  return {
    ...base,
    [column]: {
      ...columnBase,
      [value]: mapping,
    },
  }
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

  return text
}

// Returns all values found in `data` for a given column based on its settings.
// For columns of type `list_of_string`, it tries to parse each value as a JSON array,
// then a plain list with various separators.
const getValuesForColumn = (data: ImportData, column: string, settings: typeof testImportSchema["0"]) => {
  if (settings.valueType === "list_of_string") {
    return data.rows
      .map((row) => extractListOfStrings(`${row[column]}`))
      .flat()
  }
  return data.rows.map((row) => `${row[column]}`)
}

export default function ReviewValuesStep({ data, importSchema, columnMappings, mappings: defaultMappings, onBack, onNext }: Props) {
  const [mappings, setMappings] = useState<ValueMappings | null>(defaultMappings)

  const enumSchemaColumns = useMemo(
    () => importSchema.filter(
      ({ valueType, enumItems }) =>
        valueType === "list_of_string" ||
        (valueType === "string" && !!enumItems),
    ),
    [importSchema],
  )

  const columnSettings = useMemo(
    () => Object.fromEntries(importSchema.map((col) => [col.key, col])),
    [importSchema]
  )

  const mappingsToReview = useMemo(
    () => Object.fromEntries(Object.entries(columnMappings)
      .filter(([, { targetColumn }]) => enumSchemaColumns.some(
        ({ key }) => targetColumn === key,
      ))),
    [columnMappings, enumSchemaColumns]
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
    return uniqueValuesForColumn[activeColumn]
  }, [activeColumn, uniqueValuesForColumn])

  const targetValueOptions = useMemo(() => {
    if (!activeMapping) return []

    const { enumItems } = columnSettings[activeMapping.targetColumn]
    if (!enumItems) return []

    return enumItems
  }, [activeMapping, columnSettings])

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

  useEffect(() => {
    if (!columnSettings || Boolean(mappings)) return
    // infer mappings based on the schema
    setMappings(Object.fromEntries(
      Object.entries(mappingsToReview).map(([column, { targetColumn }]) => [
        column,
        Object.fromEntries(
          uniqueValuesForColumn[column]
            .map((value) => [`${value}`, inferMapping(`${value}`, columnSettings[targetColumn])])
            .filter(([, mapping]) => !!mapping)
        ),
      ])
    ))
  }, [columnSettings])

  return (
    <StepContainer>
      <Container>
        <ColumnsListWrapper>
          <Heading>Columns</Heading>
          <ColumnsList>
            {
              Object.entries(mappingsToReview).map(([column, { targetColumn }]) => (
                <li key={targetColumn}>
                  <ColumnsListButton
                    variant="text"
                    icon={resolvedColumns.includes(column) ? "check" : ""}
                    iconProps={{
                      style: { color: "var(--md-sys-color-tertiary)" }
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
        </ColumnsListWrapper>
        <ValueMappersContainer>
          <Mappers>
            <colgroup>
              <col />
              <MappersTableActionCol />
              <col />
            </colgroup>
            <MappersTableHeader>
              <tr>
                <MappersTableHeaderCell scope="col">
                  Raw Data
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
              currentUniqueValues.map((uniqueDataValue) => (
                <ColumnMapper
                  key={uniqueDataValue}
                  state={getMapperState(activeColumn, uniqueDataValue, mappings)}
                  column={uniqueDataValue}
                  action={currentMappings?.[uniqueDataValue]?.action}
                  actions={actionOptions}
                  target={currentMappings?.[uniqueDataValue]?.targetValue}
                  targetOptions={targetValueOptions}
                  errorHandling={undefined}
                  errorHandlingOptions={[]}
                  errorHandlingEnabled={false}
                  selected={false}
                  onPointerEnter={() => {}}
                  onActionChange={(action) => {
                    if (!activeColumn) return
                    setMappings(mappingUpdater(activeColumn, uniqueDataValue, { action }))
                  }}
                  onTargetChange={(targetValue) => {
                    if (!activeColumn) return
                    setMappings(mappingUpdater(
                      activeColumn,
                      uniqueDataValue,
                      {
                        targetValue,
                        action: ColumnAction.MAP,
                      },
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
