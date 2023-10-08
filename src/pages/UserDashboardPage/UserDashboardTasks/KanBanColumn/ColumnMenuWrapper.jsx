import React from 'react'
import MenuContainer from '/src/components/Menu/MenuComponents/MenuContainer'
import ColumnMenu from './ColumnMenu'
import confirmDelete from '/src/helpers/confirmDelete'

const ColumnMenuWrapper = ({
  column = {},
  tasksColumns = {},
  onCollapsedColumnsChange,
  onGroupChange,
  onGroupDelete,
  onGroupRename,
}) => {
  const { id, index, name, color, items, isGroup } = column

  // all columns except ones in items
  const otherColumns = Object.values(tasksColumns).filter((c) => !items.some((i) => i.id === c.id))

  return (
    <MenuContainer id={id} key={id} targetId={`menu-${id}`}>
      <ColumnMenu
        otherColumns={otherColumns}
        currentColumns={items}
        onCollapse={() => onCollapsedColumnsChange(id)}
        onAdd={(_, { id: c, index: ci }) =>
          onGroupChange({ id, index, name }, { id: c, index: ci })
        }
        onCreate={() => {
          onGroupChange({ id, index, name, color }, {})
          onGroupRename({ id: `${id}_group`, value: '' })
        }}
        onRemove={(_, { id: c }) => onGroupChange({ id }, {}, c)}
        onRename={() => onGroupRename({ id, value: '' })}
        onDelete={() =>
          confirmDelete({
            label: 'Column Group',
            message: 'Are you sure you want to delete this group? All columns will be split out.',
            accept: () => onGroupDelete(id),
          })
        }
        isGroup={isGroup}
      />
    </MenuContainer>
  )
}

export default ColumnMenuWrapper
