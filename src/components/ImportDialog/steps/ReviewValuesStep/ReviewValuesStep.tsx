import { Button, Icon } from "@ynput/ayon-react-components"

import { ImportData } from "../../utils"
import {
  ValueMappings,
  StepProps,
  ValueMapping,
  ImportSchema,
  ValueAction,
  ColumnMappings,
  ValueMappableColumnMappings,
  ValueMappableColumnMapping, ExtendedEnumItem
} from "../common"
import {
  Mappers,
  MappersTableHeader,
  MappersTableHeaderCell,
  MappersTableBody, MappersTableActionCol,
  StepNavButtons,
  StepNavStats,
  StepContainer,
  StepNavStatsRequired,
} from "../common.styled"
import {
  Container,
  ValueMappersContainer,
  SelectedCount,
} from "./ReviewValuesStep.styled"
import { useEffect, useMemo, useState } from "react"
import MapperRow from "../MapperRow"
import usePreset from "@components/ImportDialog/hooks/usePreset"
import { cloneDeep, merge, upperFirst } from "lodash"
import { ImportableColumn } from "@shared/api/generated/dataImport"
import useMultiSelect from "@components/ImportDialog/hooks/useMultiSelect"
import { inferMapping } from "./inferMapping"
import { mappingUpdater } from "./mappingUpdater"
import { getMapperState } from "./getMapperState"
import { sortMappingsToReviewEntries } from "./sorting"
import { getValueMappingDependencies, parseUniqueValueIfHierarchy } from "../hierarchy"
import { getMappingsToReview, getResolvedColumns, getUniqueValuesForColumn, getUnresolvedValues } from "./mappings"
import ReviewValuesColumnsList from "./ColumnsList"

type Props = StepProps<ValueMappings> & {
  data: ImportData
  importSchema: ImportSchema
  columnMappings: ColumnMappings
  mappings: ValueMappings | null
  setMappings: React.Dispatch<React.SetStateAction<ValueMappings | null>>,
}

export type ColumnMappingsEntry = [string, ValueMappableColumnMapping]

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

const enumTypes: ImportableColumn["valueType"][] = [
  "string",
  "list_of_strings",
]

export default function ReviewValuesStep({
  importContext,
  data,
  importSchema,
  columnMappings,
  mappings,
  setMappings,
  onBack,
  onNext,
}: Props) {
  const preset = usePreset()

  const columnSettings = useMemo(
    () => Object.fromEntries(importSchema.map((col) => [col.key, col])),
    [importSchema]
  )

  const mappingsToReview: ValueMappableColumnMappings = useMemo(
    () => getMappingsToReview(importSchema, columnMappings),
    [columnMappings, importSchema]
  )

  const uniqueValuesForColumn = useMemo(
    () => getUniqueValuesForColumn(
      importContext,
      columnSettings,
      data,
      columnMappings,
      mappingsToReview,
      mappings,
    ),
    [importContext, columnMappings, data.rows, columnSettings, mappingsToReview, mappings],
  )

  const unresolvedValues = useMemo(
    () => getUnresolvedValues(
      columnSettings,
      mappingsToReview,
      uniqueValuesForColumn,
      mappings,
    ),
    [columnSettings, mappingsToReview, uniqueValuesForColumn, mappings],
  )

  const resolvedColumns = useMemo(
    () => getResolvedColumns(
      mappingsToReview,
      unresolvedValues,
    ),
    [mappingsToReview, unresolvedValues],
  )

  const [sortedMappingsToReview, setSortedMappingsToReview] = useState<ColumnMappingsEntry[]>(
    Object.entries(mappingsToReview)
      .toSorted(sortMappingsToReviewEntries(resolvedColumns))
  )

  const firstTargetToReview = useMemo(() => {
    const entry = sortedMappingsToReview.at(0)
    if (!entry) return Object.values(mappingsToReview).at(0)?.targetColumn ?? ""

    return entry[1].targetColumn
  }, [sortedMappingsToReview])

  // default to the first reviewable target
  const [activeTarget, setActiveTarget] = useState(firstTargetToReview)

  useEffect(() => {
    if (!firstTargetToReview) return

    setActiveTarget(firstTargetToReview)
  }, [firstTargetToReview])

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

  const currentUniqueValues = useMemo(() => {
    if (!activeColumn) return []
    return uniqueValuesForColumn[activeColumn].sort((v1, v2) => {
      if (!v1) return -1
      return v1.localeCompare(v2)
    })
  }, [activeColumn, uniqueValuesForColumn])

  const multiSelect = useMultiSelect({ items: currentUniqueValues })

  const targetValueOptions: ExtendedEnumItem[] = useMemo(() => {
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

  const currentTargetUnmappedDependencies = useMemo(() => {
    const dependencies = getValueMappingDependencies(importContext, activeTarget)
    // get the dependencies whose respective source columns haven't been resolved yet
    return Array.from(dependencies)
      .filter((dependencyTarget) => sortedMappingsToReview.find(
        ([column, { targetColumn }]) => dependencyTarget === targetColumn && !resolvedColumns.includes(column)
      ))
  }, [importContext, activeTarget, resolvedColumns, sortedMappingsToReview])

  useEffect(() => {
    if (!columnSettings || Boolean(mappings)) return
    // infer mappings based on the schema
    const inferredMappings = Object.fromEntries(
      Object.entries(mappingsToReview).map(([column, { targetColumn }]) => [
        column,
        Object.fromEntries(
          uniqueValuesForColumn[column]
            .map((value) => {
              if (value === undefined && !columnSettings[targetColumn].enumItems) {
                return [`${value}`, { action: ValueAction.SKIP }]
              }

              const {
                source,
                entityType,
              } = parseUniqueValueIfHierarchy(targetColumn, value)

              return [
                `${value}`,
                inferMapping(`${source}`, columnSettings[targetColumn], entityType),
              ]
            })
            .filter(([, mapping]) => !!mapping)
        ),
      ])
    )

    // pre-calculate (un)resolved states so we can compute the order
    // of columns to review in the sidebar.
    const unresolvedValues = getUnresolvedValues(
      columnSettings,
      mappingsToReview,
      uniqueValuesForColumn,
      inferredMappings,
    )

    const resolvedColumns = getResolvedColumns(mappingsToReview, unresolvedValues)

    setMappings(inferredMappings)
    setSortedMappingsToReview(Object.entries(mappingsToReview)
      .toSorted(sortMappingsToReviewEntries(resolvedColumns)))
  }, [columnSettings, importSchema])

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
        <ReviewValuesColumnsList
          sortedMappingsToReview={sortedMappingsToReview}
          resolvedColumns={resolvedColumns}
          activeTarget={activeTarget}
          setActiveTarget={setActiveTarget}
          columnSettings={columnSettings}
          uniqueValuesForColumn={uniqueValuesForColumn}
          unresolvedValues={unresolvedValues}
        />
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
              currentUniqueValues.map((uniqueDataValue, index) => {
                const { source, entityType } = parseUniqueValueIfHierarchy(
                  activeTarget,
                  uniqueDataValue,
                )

                return (
                  <MapperRow
                    key={uniqueDataValue + index}
                    state={getMapperState(columnSettings[activeTarget], activeColumn, uniqueDataValue, mappings)}
                    source={source}
                    comment={upperFirst(entityType)}
                    action={currentMappings?.[uniqueDataValue]?.action}
                    actions={getActionOptions(!!activeTargetIsEnum, columnSettings[activeTarget].valueType)}
                    target={currentMappings?.[uniqueDataValue]?.targetValue}
                    targetOptions={targetValueOptions
                      .filter((option) => !option.entityType || option.entityType === entityType)
                    }
                    errorHandling={undefined}
                    errorHandlingOptions={[]}
                    errorHandlingEnabled={false}
                    valueType={columnSettings[activeTarget].valueType}
                    dropdownValueIcon
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
                      if (
                        !currentMappings?.[uniqueDataValue]
                        && columnSettings[activeTarget].valueType !== "boolean"
                      ) {
                        update.action = activeTargetIsEnum ? ValueAction.MAP : ValueAction.CREATE
                      }

                      if (multiSelect.selection.size > 0 && multiSelect.selection.has(uniqueDataValue)) {
                        setMappings(mappingUpdater(
                          activeColumn,
                          Array.from(multiSelect.selection),
                          update,
                          preset.updateValues,
                        ))

                        return
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
                )
              })
            }
            </MappersTableBody>
          </Mappers>
        </ValueMappersContainer>
      </Container>
      <StepNavButtons>
        <StepNavStats>
          {resolvedColumns.length} / {Object.keys(mappingsToReview).length} columns resolved.
          {
            activeMapping && currentTargetUnmappedDependencies.length > 0 && (
              <StepNavStatsRequired>
                <Icon icon="warning" />
                Mapping values of <strong>{
                  columnSettings[activeMapping.targetColumn].label
                }</strong> requires
                the following column{
                  currentTargetUnmappedDependencies.length === 1 ? "" : "s"
                } to be mapped: <strong>{
                  currentTargetUnmappedDependencies.map((dep) => columnSettings[dep].label).join(", ")
                }</strong>
              </StepNavStatsRequired>
            )
          }
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
