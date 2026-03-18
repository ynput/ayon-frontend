import { Button, Section } from "@ynput/ayon-react-components"
import { ImportData } from "../utils"
import { ColumnMappings, ErrorHandlingMode, StepProps } from "./common"
import { StepNavButtons } from "./common.styled"
import { useState } from "react"
import styled from "styled-components"

enum MappingState {
  UNRESOLVED = "unresolved",
  RESOLVED = "resolved",
  ERROR = "error",
}

type Props = StepProps<ColumnMappings> & {
  data: ImportData
}

type ColumnMapperProps = {
  state: MappingState
  column: string
  targetOptions: string[]
  errorHandlingOptions: ErrorHandlingMode[]
}

const Container = styled.div`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap:var(--base-gap-medium);
`

const Mappers = styled.div`
  display: flex;
  flex-direction: column;
  gap:var(--base-gap-small);
`

const Preview = styled(Mappers)`
  display: flex;
  flex-direction: column;
  gap:var(--base-gap-small);
`

const getMapperState = (column: string, mappings: ColumnMappings = {}) => {
  if (mappings[column]) return MappingState.RESOLVED

  return MappingState.UNRESOLVED
}

function ColumnMapper({ state, column, targetOptions, errorHandlingOptions }: ColumnMapperProps) {
  return (
    <Section direction="row">
      {column}
    </Section>
  )
}

export default function MapColumnsStep({ data, onBack, onNext }: Props) {
  const [mappings, setMappings] = useState<ColumnMappings | undefined>()

  return (
    <>
      <Container>
        <Mappers>
          {
            data.columns.map((column) => (
              <ColumnMapper
                state={getMapperState(column, mappings)}
                column={column}
                targetOptions={[]}
                errorHandlingOptions={[]}
              />
            ))
          }
        </Mappers>
        <Preview></Preview>
      </Container>
      <StepNavButtons>
        <Button
          variant="nav"
          label="Back"
          onClick={onBack}
        />
        <Button
          variant="filled"
          label="Next"
          disabled={!Boolean(data)}
          onClick={() => {
            if (!data) return
            onNext({})
          }}
        />
      </StepNavButtons>
    </>
  )
}
