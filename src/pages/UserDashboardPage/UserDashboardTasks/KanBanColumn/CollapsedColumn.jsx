import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './KanBanColumn.styled'

const CollapsedColumn = ({ columns = [], onChange }) => {
  // columns  = [{id: 'ready', name: 'Ready', count: 4}]

  //   if there are no columns return null
  if (!columns.length) return null

  return (
    <Styled.CollapsedWrapper>
      {columns.map((column, i) => (
        <Styled.Collapsed
          key={column.id}
          $color={column?.color}
          onClick={() => onChange(column.id)}
          style={{ top: i === 0 ? 0 : -i * 16 }}
        >
          {/* reveals the column */}
          <Icon icon="chevron_right" className="collapse" />
          <h2>
            {column?.count} - {column?.name}
          </h2>
        </Styled.Collapsed>
      ))}
    </Styled.CollapsedWrapper>
  )
}

export default CollapsedColumn
