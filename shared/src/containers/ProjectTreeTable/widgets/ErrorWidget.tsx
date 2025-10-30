import styled from 'styled-components'

const StyledErrorWidget = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 0 8px;
  font-style: italic;
  color: var(--color-row-error);
  pointer-events: none;
`

type ErrorWidgetProps = {
  label: string
}

/**
 * Widget for displaying Error rows
 * Shows a simple label indicating the Error state
 */
export const ErrorWidget = ({ label }: ErrorWidgetProps) => {
  return <StyledErrorWidget>{label}</StyledErrorWidget>
}
