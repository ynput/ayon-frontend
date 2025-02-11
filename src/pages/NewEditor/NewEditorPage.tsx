import { useSelector } from 'react-redux'
import { Splitter, SplitterPanel } from 'primereact/splitter'

import { Section, TablePanel } from '@ynput/ayon-react-components'

import { Filter } from '@components/SearchFilter/types'
import { SortByOption } from '@pages/UserDashboardPage/UserDashboardTasks/DashboardTasksToolbar/KanBanSortByOptions'
import { $Any } from '@types'

import useFetchAndUpdateEntityData from './hooks/useFetchEditorEntities'
import { getFilteredEntities } from './helpers/filters'
import { populateTableData } from './mappers/mappers'
import { FolderNodeMap, TaskNodeMap } from './types'
import entityToRowMappers from './mappers/entityToRowMappers'
import FlexTable from './FlexTable'

type Props = {
  filters: Filter[]
  showHierarchy: boolean
  sortBy: SortByOption[]
}

const NewEditorPage = ({ filters, showHierarchy, sortBy }: Props) => {
  const project = useSelector((state: $Any) => state.project)
  const projectName = useSelector((state: $Any) => state.project.name)

  const {
    rawData: allFolders,
    folders,
    tasks,
    tasksFolders,
  } = useFetchAndUpdateEntityData({
    projectName,
    folderTypes: project.folders || {},
    taskTypes: project.tasks || {},
    filters,
  })

  const {
    folders: filteredFolders,
    tasks: filteredTasks,
    taskList,
  } = getFilteredEntities({
    folders,
    tasks: tasks as TaskNodeMap,
    tasksFolders,
    filters,
    // sortBy,
  })

  const { tableData } = populateTableData({
    allFolders,
    folders: filteredFolders as FolderNodeMap,
    tasks: filteredTasks,
    taskList,
    isFlatList: !showHierarchy,
    entityToRowMappers: entityToRowMappers(project.folders, project.tasks),
  })

  return (
    <main className="editor-page" style={{ height: '100%' }}>
      <Section style={{ height: '100%' }}>
        <Splitter
          style={{ width: '100%', height: '100%' }}
          layout="horizontal"
          stateKey="editor-panels"
          stateStorage="local"
        >
          <SplitterPanel size={100}>
            <TablePanel style={{ height: '100%' }}>
              <FlexTable
                // TODO fetch & pass attrib data using new graphql queries
                rawData={{ folders, tasks }}
                tableData={tableData}
                filters={filters}
                isLoading={false}
                isExpandable={false}
                sliceId={''}
              />
            </TablePanel>
          </SplitterPanel>
        </Splitter>
      </Section>
    </main>
  )
}

export default NewEditorPage
