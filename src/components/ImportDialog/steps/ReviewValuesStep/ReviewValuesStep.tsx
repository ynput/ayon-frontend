import { Button } from "@ynput/ayon-react-components"

import { ImportData } from "../../utils"
import { ResolvedColumnMappings, ResolvedValueMappings, StepProps } from "../common"
import {
  MappersContainer,
  Mappers,
  MappersTableHeader,
  MappersTableHeaderCell,
  MappersTableBody,
  MappersTableHeaderErrorHandling,
  MappersTableActionCol,
  StepNavButtons,
} from "../common.styled"
import { StepContainer, Container, ColumnsListWrapper, Heading, ColumnsList } from "./ReviewValuesStep.styled"
import testImportSchema from "../test_import_schema"
import { useMemo, useState } from "react"
import ColumnMapper from "../ColumnMapper"

type Props = StepProps<ResolvedValueMappings> & {
  data: ImportData
  importSchema: typeof testImportSchema
  columnMappings: ResolvedColumnMappings
}

export default function ReviewValuesStep({ data, importSchema, columnMappings, onBack, onNext }: Props) {
  const [activeColumn, setActiveColumn] = useState<string | null>()

  const enumSchemaColumns = useMemo(
    () => importSchema.filter(
      ({ valueType, enumItems }) => valueType === "string" && !!enumItems,
    ),
    [importSchema],
  )

  const columnSettings = useMemo(
    () => Object.fromEntries(importSchema.map((col) => [col.key, col])),
    [importSchema]
  )

  const columnsToReview = useMemo(
    () => Object.values(columnMappings)
      .filter(({ targetColumn }) => enumSchemaColumns.some(
        ({ key }) => targetColumn === key,
      ))
      .map((columnSchema) => columnSchema),
    [columnMappings, enumSchemaColumns]
  )

  return (
    <StepContainer>
      <Container>
        <ColumnsListWrapper>
          <Heading>Columns</Heading>
          <ColumnsList>
            {
              columnsToReview.map(({ targetColumn }) => (
                <li key={targetColumn}>
                  <Button
                    variant="text"
                    selected={activeColumn === targetColumn}
                    label={columnSettings[targetColumn].label}
                    onClick={() => setActiveColumn(targetColumn)}
                  />
                </li>
              ))
            }
          </ColumnsList>
        </ColumnsListWrapper>
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
                  Raw Data
                </MappersTableHeaderCell>
                <MappersTableHeaderCell scope="col">
                  Action
                </MappersTableHeaderCell>
                <MappersTableHeaderCell scope="col">
                  Mapped Value
                </MappersTableHeaderCell>
                <MappersTableHeaderErrorHandling scope="col">
                  On error
                </MappersTableHeaderErrorHandling>
              </tr>
            </MappersTableHeader>
            <MappersTableBody>
            {/*{
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
            }*/}
            </MappersTableBody>
          </Mappers>
        </MappersContainer>
      </Container>
      <StepNavButtons>
        <Button
          variant="nav"
          label="Back"
          onClick={onBack}
        />
        <Button
          variant="filled"
          label="Continue"
          onClick={() => {
            if (!data) return
            onNext({})
          }}
        />
      </StepNavButtons>
    </StepContainer>
  )
}
