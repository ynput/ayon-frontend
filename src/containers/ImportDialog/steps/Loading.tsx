import styled from "styled-components";
import { StepContainer } from "./common.styled";

const BigBlock = styled.div`
  animation: shimmer 1.5s infinite;
  background-color: var(--md-sys-color-surface-container-low);
  flex-grow: 1;
  border-radius: var(--border-radius-m);
`

const SmallBlock = styled(BigBlock)`
  flex-grow: 0;
  height: 32px;
  width: 20%;
  margin-top: var(--padding-m);
  align-self: end;
`

export default function Loading() {
  return (
    <StepContainer>
      <BigBlock className="loading" />
      <SmallBlock className="loading" />
    </StepContainer>
  )
}
