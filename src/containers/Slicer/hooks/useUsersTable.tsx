import { useLazyGetAllProjectUsersAsAssigneeQuery } from '@queries/user/getUsers'
import { UseExtraSlices } from '@context/SlicerContext'

type Props = {
  projectName?: string | null
  useExtraSlices: UseExtraSlices
}

const useUsersTable = ({ projectName, useExtraSlices }: Props) => {
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
