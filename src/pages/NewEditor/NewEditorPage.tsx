import { useCallback } from 'react'
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

type Props = {
  filters: Filter[]
}

const NewEditorPage = ({ filters }: Props) => {
  const project = useSelector((state: $Any) => state.project)
  const projectName = useSelector((state: $Any) => state.project.name)

  const { rowSelection } = useSlicerContext()
  console.log('row selection: ', rowSelection)

  const { attribFields } = useAttributeFields()
  const { filter: sliceFilter } = useFilterBySlice()

  const {
    data: tableData,
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

  const filteredEntities = useFilteredEntities({filters, sliceFilter, selectedPaths})
  console.log('filtered entities: ', filteredEntities)

  const handleToggleFolder = useCallback(async (_: $Any, folderId: string) => {
    setExpandedItem(folderId)
  }, [])

  return (
    <main className="editor-page" style={{height: '100%'}}
    >
      <Section style={{height: '100%'}}>
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
                rootData={[]}
                tableData={tableData}
                expanded={expanded}
                setExpanded={setExpanded}
                toggleExpanderHandler={handleToggleFolder}
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
