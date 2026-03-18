import { useState } from "react"
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
    MappersTableHeaderErrorHandling
} from "./MapColumnsStep.styled"
import ColumnMapper, { MappingState } from "./ColumnMapper"

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

const getMapperState = (column: string, mappings: ColumnMappings = {}) => {
  const mapping = mappings[column]
  if (mapping && mapping.targetColumn) {
    return MappingState.RESOLVED
  }
  return MappingState.UNRESOLVED
}

const getMapperAction = (column: string, mappings: ColumnMappings = {}) => {
  if (!mappings[column]) return []
  return [mappings[column].action]
}

const mappingUpdater = (column: string, update: Partial<ColumnMapping>) => (old: ColumnMappings | undefined) => {
  const base = old ?? {}
  const mapping = Object.assign(base[column] ?? {}, update)
  return { ...base, [column]: mapping }
}

export default function MapColumnsStep({ data, onBack, onNext }: Props) {
  const [mappings, setMappings] = useState<ColumnMappings | undefined>(undefined)
  const [previewColumn, setPreviewColumn] = useState<string | null>(null)

  return (
    <StepContainer>
      <Container>
        <MappersContainer>
          <Mappers>
            <MappersTableHeader>
              <tr>
                <MappersTableHeaderCell scope="col">
                  File column
                </MappersTableHeaderCell>
                <MappersTableHeaderCell scope="col">
                </MappersTableHeaderCell>
                <MappersTableHeaderCell scope="col">
                  Attribute
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
                  action={getMapperAction(column, mappings)}
                  actions={actionOptions}
                  attributeOptions={[]}
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
                    setMappings(mappingUpdater(column, { targetColumn }))
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
          disabled={!Boolean(data)}
          onClick={() => {
            if (!data) return
            onNext({})
          }}
        />
      </StepNavButtons>
    </StepContainer>
  )
}
