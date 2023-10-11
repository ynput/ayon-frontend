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

  .message {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-radius: 3px;
    padding: 2px 4px;
    background-color: var(--color-grey-04);
  }
`

const NodePanelBody = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 0 0 6px 6px;
  border: 1px solid var(--color-grey-02);
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

const ChangeValue = styled.span`
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 3px;
  padding: 2px 6px;
  background-color: var(--color-grey-04);
  color: #dddddd;
  cursor: pointer;

  &.dim {
    font-style: italic;
    color: #949494;
  }
`

const ChangesTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  tr {
    height: 24px;
    border-bottom: 1px solid var(--color-grey-02);

    &:hover {
      background-color: var(--color-grey-02);
    }
  }

  td {
    width: 1px;
    padding: 4px 8px;
    &.expand {
      width: auto;
    }
  }
`

export {
  NodePanelWrapper,
  NodePanelHeader,
  NodePanelBody,
  NodePanelDirectionSelector,
  ChangeValue,
  ChangesTable,
}
