import styled from 'styled-components'

export const Options = styled.div`
  display: grid;
  grid-template-columns: max-content max-content 1fr;
  align-items: center;
  gap: var(--base-gap-small) var(--base-gap-large);
  margin-bottom: var(--padding-m);
`

export const OptionLabel = styled.span`
  color: var(--md-sys-color-outline);
`

export const OptionButtons = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`

export const OptionDescription = styled.span`
  color: var(--md-sys-color-outline);
`
