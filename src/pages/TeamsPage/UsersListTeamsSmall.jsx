import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import TeamMemberRow from './TeamMemberRow'
import { GroupHeader } from './UserListTeams.styled'

const UsersListTeamsSmall = ({
  handleContext,
  userList,
  isLoading,
  onSelectionChange,
  selection,
}) => {
  return (
    <Section>
      <TablePanel onContextMenu={handleContext}>
        <DataTable
          value={userList}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          className={clsx('user-list-table', 'standard-rows', { loading: isLoading })}
          rowClassName={() => clsx({ loading: isLoading })}
          onSelectionChange={onSelectionChange}
          onContextMenu={handleContext}
          selection={selection}
          resizableColumns
          responsive="true"
          autoLayout="true"
          tableStyle={{
            width: '100%',
          }}
          groupRowsBy={'group'}
          rowGroupMode="subheader"
          rowGroupHeaderTemplate={(data) => <GroupHeader>{data.group}</GroupHeader>}
        >
          <Column
            field="attrib.fullName"
            header="Full name"
            style={{ width: '20%' }}
            body={(rowData) => !isLoading && <TeamMemberRow rowData={rowData} />}
          />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default UsersListTeamsSmall
