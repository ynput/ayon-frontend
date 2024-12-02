import useLoadRemote from '@/remote/useLoadRemote'
import { Assignees, useLazyGetAllProjectUsersAsAssigneeQuery } from '@queries/user/getUsers'

type Props = {
  projectName?: string | null
}

const useExtraSlicesDefault = () => {
  return {
    formatAssignees: (_p?: Assignees): Assignees => [],
  }
}

const useUsersTable = ({ projectName }: Props) => {
  const [getUsers, { isLoading, isFetching }] = useLazyGetAllProjectUsersAsAssigneeQuery()

  const useExtraSlices = useLoadRemote({
    remote: 'slicer',
    module: 'useExtraSlices',
    fallback: useExtraSlicesDefault,
  })

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
