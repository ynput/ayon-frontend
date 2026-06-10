import { FC } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { ListEntityType } from '../NewListDialog/NewListDialog'
import { buildScopes } from '@shared/components'
import { useListItemsDataContext } from '@pages/ProjectListsPage/context/ListItemsDataContext'
import { useProjectContext } from '@shared/context'

interface ListItemsFilterProps {
  entityType: ListEntityType
  projectName: string
}

const ListItemsFilter: FC<ListItemsFilterProps> = ({ entityType, projectName }) => {
  const { ...projectInfo } = useProjectContext()
  const { listItemsFilters, setListItemsFilters } = useListItemsDataContext()

  return (
    <SearchFilterWrapper
      queryFilters={listItemsFilters}
      onChange={setListItemsFilters}
      scopes={buildScopes([entityType])}
      projectNames={[projectName]}
      projectInfo={projectInfo}
      enableGlobalSearch={false}
      config={{
        prefixes: {
          assignees: 'entity_',
          tags: 'entity_',
          status: 'entity_',
          attributes: 'attrib.',
        },
        keys: {
          taskType: entityType.startsWith('task') ? 'entity_taskType' : 'parentTaskType',
          folderType: entityType.startsWith('folder') ? 'entity_folderType' : 'parentFolderType',
          productType: entityType.startsWith('product')
            ? 'entity_productType'
            : 'parentProductType',
        },
      }}
    />
  )
}

export default ListItemsFilter
