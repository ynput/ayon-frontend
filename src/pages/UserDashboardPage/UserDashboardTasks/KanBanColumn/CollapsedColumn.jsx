import * as Styled from './KanBanColumn.styled'

const CollapsedColumn = ({ columns = [], onChange }) => {
  // columns  = [{id: 'ready', name: 'Ready', count: 4}]
  return (
    <Styled.CollapsedWrapper>
      {columns.map((column) => (
        <Styled.Collapsed key={column.id} $color={column?.color}>
          {/* reveals the column */}
          <Styled.CollapseButton
            icon="expand_more"
            variant="text"
            className="collapse"
            onClick={() => onChange(column.id)}
            style={{ rotate: '-180deg' }}
          />
          <h2>
            {column?.count} - {column?.name}
          </h2>
        </Styled.Collapsed>
      ))}
    </Styled.CollapsedWrapper>
  )
}

export default CollapsedColumn
