import styled from 'styled-components'

const NodePanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flexgrow: 1;
  border-radius: 4px;
`

const NodePanelHeader = styled.div`
  padding: 4px 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background-color: var(--color-grey-02);
  min-height: 40px;
  max-height: 40px;

  .dropdown {
    min-width: 200px;
    max-width: 200px;
  }

  border-radius: 4px;

  &.expanded {
    border-radius: 4px 4px 0 0;
`

const NodePanelToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border: 1px solid #ccc;
`

const NodePanelBody = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 0 0 4px 4px;
  border: 1px solid var(--color-grey-02);
  // min-height: 100px;
`

const NodePanelDirectionSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;

  .icon {
    font-size: 4rem;
    border-radius: var(--border-radius-m);
    user-select: none;
  }
`

const ChangeRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-bottom: 1px solid var(--color-grey-02);
`
export {
  NodePanelWrapper,
  NodePanelHeader,
  NodePanelToggle,
  NodePanelBody,
  NodePanelDirectionSelector,
  ChangeRow,
}
