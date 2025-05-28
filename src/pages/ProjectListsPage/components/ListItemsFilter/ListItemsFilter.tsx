import { FC } from 'react'
import SearchFilterWrapper from '@pages/ProjectOverviewPage/containers/SearchFilterWrapper'
import { ListEntityType } from '../NewListDialog/NewListDialog'
import { BuildFilterOptions } from '@shared/components'
import { useListItemsDataContext } from '@pages/ProjectListsPage/context/ListItemsDataContext'

interface ListItemsFilterProps {
  entityType: ListEntityType
  projectName: string
}

const ListItemsFilter: FC<ListItemsFilterProps> = ({ entityType, projectName }) => {
  const { listItemsFilters, setListItemsFilters, projectInfo } = useListItemsDataContext()

  return (
    <SearchFilterWrapper
      filters={listItemsFilters}
      onChange={setListItemsFilters}
      scope={entityType}
      projectNames={[projectName]}
      projectInfo={projectInfo}
      filterTypes={getFilterTypesByScope(entityType)}
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

const getFilterTypesByScope = (entityType: ListEntityType): BuildFilterOptions['filterTypes'] => {
  const base: BuildFilterOptions['filterTypes'] = ['status', 'tags', 'attributes']
  switch (entityType) {
    case 'folder':
      return [...base, 'folderType']
    case 'task':
      return [...base, 'taskType', 'folderType', 'assignees']
    case 'version':
      return [...base, 'taskType', 'productType', 'folderType']

    default:
      return []
  }
}
