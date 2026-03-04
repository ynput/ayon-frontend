import styled from 'styled-components'

const StyledEmptyWidget = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 0 8px;
  font-style: italic;
  color: var(--md-sys-color-outline);
  pointer-events: none;
`

type EmptyWidgetProps = {
  label: string
}

/**
 * Widget for displaying empty rows (e.g., products with no versions)
 * Shows a simple label indicating the empty state
 */
export const EmptyWidget = ({ label }: EmptyWidgetProps) => {
  return <StyledEmptyWidget>{label}</StyledEmptyWidget>
}
