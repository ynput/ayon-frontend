import { FC } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { ListEntityType } from '../NewListDialog/NewListDialog'
import { buildScopes, FilterFieldType } from '@shared/components'
import { useListItemsDataContext } from '@pages/ProjectListsPage/context/ListItemsDataContext'
import { useProjectContext } from '@shared/context'

// list items endpoint whitelists entity/parent columns; versions have no name
// column and the endpoint knows no productBaseType/hasReviewables at all
const UNSUPPORTED_BY_LIST_ITEMS: Partial<Record<ListEntityType, FilterFieldType[]>> = {
  version: ['name', 'productBaseType', 'hasReviewables'],
}

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
      scopes={buildScopes([entityType], UNSUPPORTED_BY_LIST_ITEMS)}
      projectNames={[projectName]}
      projectInfo={projectInfo}
      enableGlobalSearch={false}
      data={entityType === 'version' ? { productTypes: projectInfo.productTypes } : {}}
      config={{
        prefixes: {
          assignees: 'entity_',
          tags: 'entity_',
          status: 'entity_',
          name: 'entity_',
          author: 'entity_',
          version: 'entity_',
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
