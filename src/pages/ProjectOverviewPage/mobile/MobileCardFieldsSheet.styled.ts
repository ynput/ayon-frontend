import styled from 'styled-components'

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 8px 16px;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  button {
    min-height: 44px;
    color: var(--md-sys-color-primary);
    font-weight: 600;
  }
`

export const Section = styled.section`
  padding: 0 12px 16px;
`

export const SectionTitle = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px;
  font-weight: 600;

  .count {
    font-size: 12px;
    font-weight: normal;
    color: var(--md-sys-color-on-surface-variant);
  }
`

export const Hint = styled.p`
  margin: 2px 4px 8px;
  font-size: 12px;
  line-height: 16px;
  color: var(--md-sys-color-on-surface-variant);
`

export const Group = styled.div`
  border-radius: 8px;
  background-color: var(--md-sys-color-surface-container);
  overflow: hidden;

  & > button {
    width: 100%;
    min-height: 48px;
    border-radius: 0;
  }
`

export const LockedRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 12px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  font-weight: 600;

  .always {
    margin-left: auto;
    font-size: 12px;
    font-weight: normal;
    color: var(--md-sys-color-on-surface-variant);
  }
`

export const FieldRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  min-height: 48px;
  background-color: var(--md-sys-color-surface-container);

  & + & {
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }

  &.dragging {
    z-index: 1;
    background-color: var(--md-sys-color-surface-container-highest);
  }

  & > button:last-child {
    flex: 1;
    min-width: 0;
    min-height: 48px;
    border-radius: 0;
    background: none;
  }
`

export const DragHandle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 48px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--md-sys-color-on-surface-variant);
  cursor: grab;
  touch-action: none;
`

export const FieldLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  span:last-child {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`
