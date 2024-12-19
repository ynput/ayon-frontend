import { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Section, TablePanel } from '@ynput/ayon-react-components'

import { $Any } from '@types'
import { useGetAttributeListQuery } from '@queries/attributes/getAttributes'
import { Splitter, SplitterPanel } from 'primereact/splitter'

import MyTable from './Table'
import useExtendedHierarchyTable from './useExtendedHierarchyTable'
import { Filter } from '@components/SearchFilter/types'
import { useSlicerContext } from '@context/slicerContext'

type Props = {
  filters: Filter[]
}

const NewEditorPage = ({ filters }: Props) => {
  const project = useSelector((state: $Any) => state.project)

  const projectName = useSelector((state: $Any) => state.project.name)

  const { rowSelection, sliceType } = useSlicerContext()

  // @ts-ignore
  let { data: attribsData = [] } = useGetAttributeListQuery({}, { refetchOnMountOrArgChange: true })

  //   filter out scopes
  const attribFields = attribsData.filter((a: $Any) =>
    a.scope.some((s: $Any) => ['folder', 'task'].includes(s)),
  )

  const { data, setExpandedItem, expanded, setExpanded } = useExtendedHierarchyTable({
    projectName,
    folderTypes: project.folders || {},
    taskTypes: project.tasks || {},
    selectedFolders: Object.keys(rowSelection),
  })

  const handleToggleFolder = useCallback(async (event: $Any, folderId: string) => {
    setExpandedItem(folderId)
  }, [])

  return (
    <main className="editor-page">
      <Section>
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
                tableData={data}
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
