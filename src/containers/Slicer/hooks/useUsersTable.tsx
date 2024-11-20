import { useLazyGetAllProjectUsersAsAssigneeQuery } from '@queries/user/getUsers'
import { TableRow } from '../SlicerTable'
import UserImage from '@components/UserImage'

type Props = {
  projectName?: string | null
}

const useUsersTable = ({ projectName }: Props) => {
  const [getUsers, { isLoading, isFetching }] = useLazyGetAllProjectUsersAsAssigneeQuery()

  const onGetUsers = async () => {
    const users = await getUsers({ projectName: projectName || '' }, true).unwrap()

    // transform data into table rows
    const userTableRows: TableRow[] = users.map((user) => ({
      id: user.name,
      name: user.name,
      label: user.fullName || user.name,
      startContent: (
        <UserImage
          name={user.name}
          fullName={user.fullName || user.name}
          imageKey={user.updatedAt}
          size={20}
          style={{ minWidth: 20 }}
        />
      ),
      subRows: [],
      data: {
        id: user.name,
        name: user.name,
        label: user.fullName,
      },
    }))

    const sortedRows = userTableRows.sort((a, b) => a.label.localeCompare(b.label))

    return sortedRows
  }

  return {
    getData: onGetUsers,
    isLoading: isLoading || isFetching,
  }
}

export default useUsersTable
