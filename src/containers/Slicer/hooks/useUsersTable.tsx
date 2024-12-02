import { useLazyGetAllProjectUsersAsAssigneeQuery } from '@queries/user/getUsers'
import useExtraSlices from 'slicer/useExtraSlices'

type Props = {
  projectName?: string | null
}

const useUsersTable = ({ projectName }: Props) => {
  const [getUsers, { isLoading, isFetching }] = useLazyGetAllProjectUsersAsAssigneeQuery()

  const { formatAssignees } = useExtraSlices()

  const onGetUsers = async () => {
    // get all users
    const users = await getUsers({ projectName: projectName || '' }, true).unwrap()
    // format users into table rows
    return formatAssignees(users)
  }

  return {
    getData: onGetUsers,
    isLoading: isLoading || isFetching,
  }
}

export default useUsersTable
