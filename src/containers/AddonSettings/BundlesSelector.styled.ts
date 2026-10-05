import styled from 'styled-components'

export const DropdownBadge = styled.span`
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: black;
  background-color: var(--color-hl-developer);
  margin-left: 8px;
  height: 18px;
  min-width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.staging {
    background-color: var(--color-hl-staging);
  }

  &.production {
    background-color: var(--color-hl-production);
  }

  &.project {
    background-color: var(--color-hl-project);
  }
`
