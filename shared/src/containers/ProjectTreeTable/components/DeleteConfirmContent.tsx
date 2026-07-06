import styled from 'styled-components'

export const pluralize = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : singular + 's'}`

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
`

export type DeleteConfirmContentProps = {
  entityLabel: string
  childrenDetails: string[]
}

export const DeleteConfirmContent = ({
  entityLabel,
  childrenDetails,
}: DeleteConfirmContentProps) => (
  <Wrapper>
    <p>{`Are you sure you want to delete ${entityLabel}? This action cannot be undone.`}</p>
    {childrenDetails.length > 0 && (
      <DetailsContainer>
        <BoldLabel>The following will also be affected:</BoldLabel>
        {childrenDetails.map((detail, i) => (
          <p key={i}>{detail}</p>
        ))}
      </DetailsContainer>
    )}
  </Wrapper>
)
