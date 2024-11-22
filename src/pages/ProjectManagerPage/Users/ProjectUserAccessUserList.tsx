
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import clsx from 'clsx'
import { $Any } from '@types'
import { UserNode } from '@api/graphql'
import { StyledEmptyPlaceholder, StyledEmptyPlaceholderWrapper } from './ProjectUserAccess.styled'
import UserColumn from './UserColumn'
import AccessGroupsColumn from './AccessGroupsColumn'
import { HoveredUser } from './types'


type Props = {
  selectedProjects: string[]
  selectedUsers: string[]
  tableList: $Any
  accessGroup?: string
  hoveredUser?: HoveredUser
  isLoading: boolean
  readOnly: boolean,
  header?: string
  emptyMessage: string
  sortable?: boolean
  isUnassigned?: boolean
  showAddButton?: boolean
  showAddMoreButton?: boolean
  showAccessGroups?: boolean
  onContextMenu?: $Any
  onHoverRow: $Any
  onSelectUsers?: (selectedUsers: string[]) => void
  onAdd: (users? : string[]) => void
  onRemove?: (users?: string[]) => void
}

const ProjectUserAccessUserList = ({
  selectedProjects,
  selectedUsers,
  tableList,
  accessGroup,
  hoveredUser,
  isLoading,
  readOnly,
  header,
  emptyMessage,
  sortable = false,
  showAddButton = false,
  showAddMoreButton = false,
  showAccessGroups = false,
  onAdd,
  onRemove,
  onContextMenu,
  onSelectUsers,
  onHoverRow,
}: Props) => {
  const onSelectionChange = (e: $Any) => {
    const result = e.value.map((user: UserNode) => user.name)

    onSelectUsers!(result)
  }
  const selectedUnassignedUsers = tableList.filter((user: $Any) =>
    selectedUsers.includes(user.name),
  )
  const selectedUnassignedUserNames = selectedUnassignedUsers.map((user: $Any) => user.name)
  // Render

  if (tableList.length === 0) {
    return (
      <StyledEmptyPlaceholderWrapper>
        {header && <p className="header">{header}</p>}
        <StyledEmptyPlaceholder icon="person" message={emptyMessage} style={{}} />
      </StyledEmptyPlaceholderWrapper>
    )
  }

  return (
    <Section style={{ height: '100%' }}>
      <TablePanel style={!showAccessGroups ? { borderRadius: 0 } : undefined}>
        <DataTable
          data-testid={`accessGroupPanel-${header}`}
          selection={selectedUnassignedUsers}
          value={tableList}
          selectionMode="multiple"
          scrollable={true}
          scrollHeight="flex"
          emptyMessage={emptyMessage}
          dataKey="name"
          className={clsx('user-list-table', { loading: isLoading })}
          rowClassName={(rowData: $Any) => clsx({ inactive: !rowData.active, loading: isLoading })}
          onContextMenu={!readOnly && onContextMenu}
          onRowMouseEnter={(e) => onHoverRow(e.data.name)}
          onRowMouseLeave={() => onHoverRow()}
          onSelectionChange={(selection) => {
            return onSelectUsers && onSelectionChange(selection)
          }}
        >
          <Column
            field="name"
            header={header}
            headerStyle={header ? { textTransform: 'capitalize' } : {display: 'none'}}
            body={(rowData) =>
              !isLoading && (
                <UserColumn
                  rowData={rowData}
                  data-testid={`accessGroupUser-${rowData.name}`}
                  showAddButton={showAddButton}
                  showAddMoreButton={showAddMoreButton}
                  readOnly={readOnly}
                  onAdd={(user?: string) => onAdd(user ? [user] : undefined)}
                  hovering={
                    hoveredUser?.user == rowData.name && hoveredUser?.accessGroup === accessGroup
                  }
                  onRemove={() => {
                    onRemove && onRemove([rowData.name])
                  }}
                  showButtonsOnHover={!showAccessGroups && selectedUnassignedUsers.length == 0}
                  addButtonDisabled={selectedProjects.length === 0}
                  selected={selectedUnassignedUserNames.includes(rowData.name)}
                />
              )
            }
            sortable={sortable}
          />
          {showAccessGroups && (
            <Column
              header="Project access groups"
              body={(data) =>
                !isLoading && (
                  <AccessGroupsColumn
                    data={data}
                    data-testid={`accessGroupUser-${data.name}`}
                    showAddButton={showAddButton}
                    readOnly={readOnly}
                    onAdd={(user?: string) => onAdd(user ? [user] : undefined)}
                    hovering={
                      hoveredUser?.user == data.name && hoveredUser?.accessGroup === accessGroup
                    }
                    addButtonDisabled={selectedProjects.length === 0}
                    selected={selectedUnassignedUserNames.includes(data.name)}
                  />
                )
              }
            />
          )}
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default ProjectUserAccessUserList
