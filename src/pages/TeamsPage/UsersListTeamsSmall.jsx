import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import { ProfileRow } from '@pages/SettingsPage/UsersSettings/UserList'
import clsx from 'clsx'

const UsersListTeamsSmall = ({
  handleContext,
  userList,
  isLoading,
  onSelectionChange,
  onContextSelectionChange,
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
          className={clsx('user-list-table', { loading: isLoading })}
          rowClassName={() => clsx({ loading: isLoading })}
          onSelectionChange={onSelectionChange}
          onContextMenuSelectionChange={onContextSelectionChange}
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
          rowGroupHeaderTemplate={(data) => {
            return <div>{data.group}</div>
          }}
        >
          <Column
            field="attrib.fullName"
            header="Full Name"
            style={{ width: '20%' }}
            body={(rowData) => !isLoading && <ProfileRow rowData={rowData} />}
          />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default UsersListTeamsSmall
