import styled from 'styled-components'
import type { DeletableEntityType } from '@shared/context/delete-entities'

export type ExpectedDeleteCounts = Partial<Record<DeletableEntityType, number>>

// deletes above this total require typed count confirmation; a delete of exactly
// one entity types its name instead
export const DELETE_CONFIRM_THRESHOLD = 1

const Wrapper = styled.div`
  min-width: 350px;
`
const DetailsContainer = styled.div`
  margin-top: 12px;
  min-height: 60px;
  min-width: 350px;
`
const BoldLabel = styled.p`
  font-weight: 600;
  margin-bottom: 4px;
`
const TotalLine = styled.p`
  margin-top: 12px;
  font-weight: 600;
  color: var(--md-sys-color-error);
`

export type DeleteConfirmContentProps = {
  entityLabel: string
  childrenDetails: string[]
  totalLine?: string
  message?: string
}

export const DeleteConfirmContent = ({
  entityLabel,
  childrenDetails,
  totalLine,
  message,
}: DeleteConfirmContentProps) => (
  <Wrapper>
    <p>
      {message || `Are you sure you want to delete ${entityLabel}? This action cannot be undone.`}
    </p>
    {childrenDetails.length > 0 && (
      <DetailsContainer>
        <BoldLabel>The following will also be affected:</BoldLabel>
        {childrenDetails.map((detail, i) => (
          <p key={i}>{detail}</p>
        ))}
      </DetailsContainer>
    )}
    {totalLine && <TotalLine>{totalLine}</TotalLine>}
  </Wrapper>
)
