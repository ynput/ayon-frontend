import { useSelector } from 'react-redux'

import { Section, TablePanel } from '@ynput/ayon-react-components'

import { $Any } from '@types'
import { Splitter, SplitterPanel } from 'primereact/splitter'

import MyTable from './Table'
import useExtendedHierarchyTable from './useExtendedHierarchyTable'
import { Filter } from '@components/SearchFilter/types'
import { useSlicerContext } from '@context/slicerContext'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import useAttributeFields from './useAttributesList'
import useFilteredEntities from './useFilteredEntities'
import { handleToggleFolder } from './handlers'
import { populateTableData } from './mappers'

type Props = {
  filters: Filter[]
}

const NewEditorPage = ({ filters }: Props) => {
  const project = useSelector((state: $Any) => state.project)
  const projectName = useSelector((state: $Any) => state.project.name)

  const { rowSelection } = useSlicerContext()
  const { attribFields } = useAttributeFields()
  const { filter: sliceFilter } = useFilterBySlice()

  const {
    rawData,
    setExpandedItem,
    expanded,
    setExpanded,
    selectedPaths,
  } = useExtendedHierarchyTable({
    projectName,
    folderTypes: project.folders || {},
    taskTypes: project.tasks || {},
    selectedFolders: Object.keys(rowSelection),
  })
  console.log('raw data: ', rawData )
  console.log('expanded: ', expanded )
  console.log('row selection: ', rowSelection )

  // @ts-ignore
  const { folders, tasks } = useFilteredEntities({ filters, sliceFilter, selectedPaths, expanded, rowSelection })
  console.log('folders: ', folders)
  console.log('tasks: ', tasks)
  const { tableData: populatedTableData } = populateTableData({
    rawData,
    folders,
    tasks,
    folderTypes: project.folders,
    taskTypes: project.tasks,
  })
  console.log('rd: ', rawData)
  console.log('pd: ', populatedTableData)
  const toggleHandler = handleToggleFolder(setExpandedItem)

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
              <MyTable
                attribs={attribFields}
                // TODO fetch & pass attrib data using new graphql queries
                rawData={{folders, tasks}}
                tableData={populatedTableData}
                expanded={expanded}
                setExpanded={setExpanded}
                toggleExpanderHandler={toggleHandler}
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
