import { useListsModuleContext } from '@pages/ProjectListsPage/context/ListsModulesContext'
import {
  EntityListModel,
  useGetCurrentUserQuery,
  useGetShareOptionsQuery,
  useUpdateEntityListMutation,
} from '@shared/api'
import { RequiredPowerpackVersion } from '@shared/components/Powerpack/RequiredPowerpackVersion'
import { usePowerpack } from '@shared/context'
import { FC } from 'react'

export interface ListAccessFormProps {
  list: EntityListModel
  projectName: string
  isLoading: boolean
}

export const ListAccessForm: FC<ListAccessFormProps> = ({ list, projectName, isLoading }) => {
  //   get current user data
  const { data: currentUser } = useGetCurrentUserQuery()
  const { powerLicense } = usePowerpack()

  const { data: shareOptions = [], isFetching: isShareOptionsLoading } = useGetShareOptionsQuery(
    {
      projectName,
    },
    { skip: !powerLicense },
  )

  const [updateList] = useUpdateEntityListMutation()

  // load in sharing module
  const { ListAccess, requiredVersion } = useListsModuleContext()

  if (!currentUser) return 'Loading user...'

  if (requiredVersion.access)
    return <RequiredPowerpackVersion requiredVersion={requiredVersion.access} />

  return (
    <ListAccess
      {...list}
      isLoading={isLoading}
      currentUser={currentUser}
      shareOptions={shareOptions}
      isShareOptionsLoading={isShareOptionsLoading}
      onUpdateList={(payload) =>
        updateList({
          listId: list.id as string,
          projectName,
          entityListPatchModel: payload,
        }).unwrap()
      }
    />
  )
}
