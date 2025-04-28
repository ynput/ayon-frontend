import { useLazyGetTasksByParentQuery } from '@queries/overview/getOverview'
import { useUpdateOverviewEntitiesMutation } from '@queries/overview/updateOverview'
import { ProjectTableQueriesProviderProps } from '@shared/containers/ProjectTreeTable'

type Props = {
  projectName: string
}

const useTableQueriesHelper = ({ projectName }: Props) => {
  const [entityOperations] = useUpdateOverviewEntitiesMutation()
  const updateEntities: ProjectTableQueriesProviderProps['updateEntities'] = async ({
    operations,
    patchOperations,
  }) => {
    return await entityOperations({
      operationsRequestModel: { operations },
      patchOperations,
      projectName: projectName,
    }).unwrap()
  }
  const [fetchFolderTasks] = useLazyGetTasksByParentQuery()
  const getFoldersTasks: ProjectTableQueriesProviderProps['getFoldersTasks'] = async (
    args,
    force,
  ) => {
    return await fetchFolderTasks(
      {
        projectName: projectName,
        ...args,
      },
      force,
    ).unwrap()
  }

  return { updateEntities, getFoldersTasks }
}

export default useTableQueriesHelper
